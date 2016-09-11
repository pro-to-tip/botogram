import fs from 'fs';
import path from 'path';
import request from 'request';
import fileType from 'file-type';
import mime from 'mime';
import { isURL } from 'validator';
import { Stream } from 'stream';


export function apiRequest(method, options = {}) {
  let opts = {
    url: `https://api.telegram.org/bot${options.token}/${method}`
  };

  if (options.formData) {
    opts.formData = options.params;
    var value = opts.formData[options.formData].value;
  } else { 
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(options.params);
  }

  return new Promise((resolve, reject) => {
    if (value instanceof Stream) {
      value
        .on('response', res => {
          if (res.statusCode !== 200) 
            return reject({ ok: false, description: `Server responded status ${res.statusCode}.` });
        })
        .on('error', err => {
          reject({ ok: false, description: err.message });
        });
    }
    
    request.post(opts, (err, res, body) => {
      if (err) return reject({ ok: false, description: err.message });
      
      if (res.statusCode !== 200) {
        try {
          return reject(JSON.parse(body));
        } catch(e) {
          return reject({ ok: false, description: `Server responded status ${res.statusCode}.`, body });
        }
      }

      resolve(JSON.parse(body));
    });
  });
}

export function prepareFormData(type, data) {
  return new Promise(resolve => {
    if (Buffer.isBuffer(data)) {
      let file = fileType(data);
      
      if (!file) 
        throw { ok: false, description: 'Unsupported file type. Try to pass a file by another way.' };

      resolve({
        value: data,
        options: {
          filename: `${type}.${file.ext}`,
          contentType: file.mime
        }
      });
    } else if (fs.existsSync(data)) {
      resolve({
        value: fs.createReadStream(data),
        options: {
          filename: path.basename(data),
          contentType: mime.lookup(data)
        }
      });
    } else if (isURL(data, { protocols: ['http', 'https'], require_protocol: true })) {
      resolve({
        value: request(data),
        options: {
          filename: path.basename(data),
          contentType: mime.lookup(data)
        }
      });
    } else {
      resolve(data);
    }
  });
}

export function sendFile(type, options = {}) {
  return prepareFormData(type, options.params[type])
    .then(formData => {
      options.params[type] = formData;
      options.formData = type;
      return apiRequest(`send${type}`, options);
    });
}

export function logEvent(event, type) {
  let { username, first_name, last_name, id } = event.from,
    text = `${this.data.username}:${username ? ` [${username}]` : ''} ${first_name + (last_name ? ` ${last_name}` : '')} (${id}): <${type}> ${(((typeof event[type] === 'object' ? ' ' : event[type]) || event.text || event.data || event.query)).replace(/\n/g, ' ')}`;
  
  console.log(text.length > 200 ? `${text.slice(0, 200)}...` : text);
}