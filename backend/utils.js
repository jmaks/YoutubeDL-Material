var fs = require('fs-extra')
var path = require('path')
const config_api = require('./config');

const is_windows = process.platform === 'win32';

function getTrueFileName(unfixed_path, type) {
    let fixed_path = unfixed_path;

    const new_ext = (type === 'audio' ? 'mp3' : 'mp4');
    let unfixed_parts = unfixed_path.split('.');
    const old_ext = unfixed_parts[unfixed_parts.length-1];


    if (old_ext !== new_ext) {
        unfixed_parts[unfixed_parts.length-1] = new_ext;
        fixed_path = unfixed_parts.join('.');
    }
    return fixed_path;
}

function getDownloadedFilesByType(basePath, type) {
    // return empty array if the path doesn't exist
    if (!fs.existsSync(basePath)) return [];

    let files = [];
    const ext = type === 'audio' ? 'mp3' : 'mp4';
    var located_files = recFindByExt(basePath, ext);
    for (let i = 0; i < located_files.length; i++) {
        let file = located_files[i];
        var file_path = path.basename(file);

        var stats = fs.statSync(file);

        var id = file_path.substring(0, file_path.length-4);
        var jsonobj = getJSONByType(type, id, basePath);
        if (!jsonobj) continue;
        var title = jsonobj.title;
        var url = jsonobj.webpage_url;
        var uploader = jsonobj.uploader;
        var upload_date = jsonobj.upload_date;
        upload_date = upload_date ? `${upload_date.substring(0, 4)}-${upload_date.substring(4, 6)}-${upload_date.substring(6, 8)}` : null;
        var thumbnail = jsonobj.thumbnail;
        var duration = jsonobj.duration;

        var size = stats.size;

        var isaudio = type === 'audio';
        var file_obj = new File(id, title, thumbnail, isaudio, duration, url, uploader, size, file, upload_date);
        files.push(file_obj);
    }
    return files;
}

function getJSONMp4(name, customPath, openReadPerms = false) {
    var obj = null; // output
    if (!customPath) customPath = config_api.getConfigItem('ytdl_video_folder_path');
    var jsonPath = path.join(customPath, name + ".info.json");
    var alternateJsonPath = path.join(customPath, name + ".mp4.info.json");
    if (fs.existsSync(jsonPath))
    {
        obj = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } else if (fs.existsSync(alternateJsonPath)) {
        obj = JSON.parse(fs.readFileSync(alternateJsonPath, 'utf8'));
    }
    else obj = 0;
    return obj;
}

function getJSONMp3(name, customPath, openReadPerms = false) {
    var obj = null;
    if (!customPath) customPath = config_api.getConfigItem('ytdl_audio_folder_path');
    var jsonPath = path.join(customPath, name + ".info.json");
    var alternateJsonPath = path.join(customPath, name + ".mp3.info.json");
    if (fs.existsSync(jsonPath)) {
        obj = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    }
    else if (fs.existsSync(alternateJsonPath)) {
        obj = JSON.parse(fs.readFileSync(alternateJsonPath, 'utf8'));
    }
    else
        obj = 0;

    return obj;
}

function getJSONByType(type, name, customPath, openReadPerms = false) {
    return type === 'audio' ? getJSONMp3(name, customPath, openReadPerms) : getJSONMp4(name, customPath, openReadPerms)
}

function fixVideoMetadataPerms(name, type, customPath = null) {
    if (is_windows) return;
    if (!customPath) customPath = type === 'audio' ? config_api.getConfigItem('ytdl_audio_folder_path')
                                                   : config_api.getConfigItem('ytdl_video_folder_path');

    const ext = type === 'audio' ? '.mp3' : '.mp4';
    
    const files_to_fix = [
        // JSONs
        path.join(customPath, name + '.info.json'),
        path.join(customPath, name + ext + '.info.json'),
        // Thumbnails
        path.join(customPath, name + '.webp'),
        path.join(customPath, name + '.jpg')
    ];

    for (const file of files_to_fix) {
        if (!fs.existsSync(file)) continue;
        fs.chmodSync(file, 0o644);
    }
}

function recFindByExt(base,ext,files,result)
{
    files = files || fs.readdirSync(base)
    result = result || []

    files.forEach(
        function (file) {
            var newbase = path.join(base,file)
            if ( fs.statSync(newbase).isDirectory() )
            {
                result = recFindByExt(newbase,ext,fs.readdirSync(newbase),result)
            }
            else
            {
                if ( file.substr(-1*(ext.length+1)) == '.' + ext )
                {
                    result.push(newbase)
                }
            }
        }
    )
    return result
}

// objects

function File(id, title, thumbnailURL, isAudio, duration, url, uploader, size, path, upload_date) {
    this.id = id;
    this.title = title;
    this.thumbnailURL = thumbnailURL;
    this.isAudio = isAudio;
    this.duration = duration;
    this.url = url;
    this.uploader = uploader;
    this.size = size;
    this.path = path;
    this.upload_date = upload_date;
}

module.exports = {
    getJSONMp3: getJSONMp3,
    getJSONMp4: getJSONMp4,
    getTrueFileName: getTrueFileName,
    fixVideoMetadataPerms: fixVideoMetadataPerms,
    getDownloadedFilesByType: getDownloadedFilesByType,
    recFindByExt: recFindByExt,
    File: File
}
