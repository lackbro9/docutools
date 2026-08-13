/* DocuTools - Image Resizer tool */
(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded', function(){
    var dropzone = document.getElementById('dropzone');
    var input = document.getElementById('file-input');
    var listEl = document.getElementById('file-list');
    var dimsLine = document.getElementById('dims-line');
    var widthInput = document.getElementById('width-input');
    var heightInput = document.getElementById('height-input');
    var lockCheckbox = document.getElementById('lock-aspect');
    var convertBtn = document.getElementById('convert-btn');
    var resetBtn = document.getElementById('reset-btn');
    var statusBox = document.getElementById('status-box');
    var resultPanel = document.getElementById('result-panel');
    var resultSummary = document.getElementById('result-summary');
    var resultImg = document.getElementById('result-img');
    var downloadBtn = document.getElementById('download-btn');
    var current = null; /* { file, img, width, height, mime } */
    var resultBlob = null;
    var aspectRatio = 1;
    var updatingFromCode = false;

    function renderFile(file){
      window.DocuComponents.renderFileList(listEl, file ? [{ id: 'f', label: file.name, sizeText: window.DocuUtils.formatBytes(file.size) }] : [], {
        onRemove: function(){ resetAll(); }, onMoveUp: function(){}, onMoveDown: function(){}
      });
    }

    function resetAll(){
      current = null;
      resultBlob = null;
      input.value = '';
      renderFile(null);
      dimsLine.style.display = 'none';
      widthInput.value = '';
      heightInput.value = '';
      convertBtn.disabled = true;
      resultPanel.style.display = 'none';
      window.DocuUtils.clearStatus(statusBox);
    }

    function handleFiles(fileList){
      var result = window.DocuUtils.validateFiles(fileList, {
        acceptExt: ['.jpg', '.jpeg', '.png', '.webp'],
        acceptMime: ['image/jpeg', 'image/png', 'image/webp'],
        maxSizeMB: 25, maxFiles: 1
      });
      if (result.errors.length){
        window.DocuUtils.setStatus(statusBox, 'error', result.errors.join(' '));
        return;
      }
      var file = result.valid[0];
      renderFile(file);
      window.DocuImage.loadImageElement(file).then(function(loaded){
        current = { file: file, img: loaded.img, width: loaded.width, height: loaded.height, mime: file.type || 'image/png' };
        aspectRatio = loaded.width / loaded.height;
        dimsLine.style.display = 'block';
        dimsLine.textContent = 'Original size: ' + loaded.width + ' x ' + loaded.height + ' px.';
        updatingFromCode = true;
        widthInput.value = loaded.width;
        heightInput.value = loaded.height;
        updatingFromCode = false;
        convertBtn.disabled = false;
        window.DocuUtils.clearStatus(statusBox);
      }).catch(function(err){
        window.DocuUtils.setStatus(statusBox, 'error', err.message);
      });
    }

    window.DocuUtils.setupDropzone(dropzone, input, handleFiles);

    widthInput.addEventListener('input', function(){
      if (updatingFromCode || !lockCheckbox.checked) return;
      var w = parseInt(widthInput.value, 10);
      if (w > 0){
        updatingFromCode = true;
        heightInput.value = Math.round(w / aspectRatio);
        updatingFromCode = false;
      }
    });
    heightInput.addEventListener('input', function(){
      if (updatingFromCode || !lockCheckbox.checked) return;
      var h = parseInt(heightInput.value, 10);
      if (h > 0){
        updatingFromCode = true;
        widthInput.value = Math.round(h * aspectRatio);
        updatingFromCode = false;
      }
    });

    convertBtn.addEventListener('click', function(){
      if (!current) return;
      var w = parseInt(widthInput.value, 10);
      var h = parseInt(heightInput.value, 10);
      if (!w || !h || w <= 0 || h <= 0){
        window.DocuUtils.setStatus(statusBox, 'error', 'Please enter a valid width and height.');
        return;
      }
      if (w > 8000 || h > 8000){
        window.DocuUtils.setStatus(statusBox, 'error', 'Please choose dimensions of 8000px or smaller.');
        return;
      }
      convertBtn.disabled = true;
      window.DocuUtils.setStatus(statusBox, 'progress', 'Resizing...');
      try {
        var canvas = window.DocuImage.drawToCanvas(current.img, w, h, current.mime === 'image/jpeg');
        window.DocuImage.canvasToBlob(canvas, current.mime, 0.92).then(function(blob){
          resultBlob = blob;
          resultImg.src = URL.createObjectURL(blob);
          resultSummary.textContent = 'New size: ' + w + ' x ' + h + ' px. File size: ' + window.DocuUtils.formatBytes(blob.size);
          window.DocuUtils.setStatus(statusBox, 'success', 'Done.');
          resultPanel.style.display = 'block';
          convertBtn.disabled = false;
        }).catch(function(err){
          window.DocuUtils.setStatus(statusBox, 'error', err.message);
          convertBtn.disabled = false;
        });
      } catch (err){
        window.DocuUtils.setStatus(statusBox, 'error', 'Could not resize this image: ' + err.message);
        convertBtn.disabled = false;
      }
    });

    downloadBtn.addEventListener('click', function(){
      if (!resultBlob || !current) return;
      var ext = current.mime === 'image/png' ? 'png' : (current.mime === 'image/webp' ? 'webp' : 'jpg');
      window.DocuUtils.triggerDownload(resultBlob, window.DocuUtils.safeFilename('docutools-resized', ext));
    });

    resetBtn.addEventListener('click', resetAll);
    resetAll();
  });
})();
