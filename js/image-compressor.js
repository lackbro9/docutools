/* DocuTools - Image Compressor tool. Re-encodes an image at a chosen quality using Canvas. */
(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded', function(){
    var dropzone = document.getElementById('dropzone');
    var input = document.getElementById('file-input');
    var listEl = document.getElementById('file-list');
    var formatSelect = document.getElementById('format-select');
    var qualityRange = document.getElementById('quality-range');
    var qualityValueLabel = document.getElementById('quality-value');
    var convertBtn = document.getElementById('convert-btn');
    var resetBtn = document.getElementById('reset-btn');
    var statusBox = document.getElementById('status-box');
    var resultPanel = document.getElementById('result-panel');
    var compareTable = document.getElementById('compare-table');
    var resultImg = document.getElementById('result-img');
    var downloadBtn = document.getElementById('download-btn');
    var current = null;
    var resultBlob = null;

    if (!window.DocuImage.supportsWebpEncoding()){
      var webpOption = formatSelect.querySelector('option[value="image/webp"]');
      if (webpOption) webpOption.disabled = true;
    }

    qualityRange.addEventListener('input', function(){
      qualityValueLabel.textContent = qualityRange.value + '%';
    });

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
        current = { file: file, img: loaded.img, width: loaded.width, height: loaded.height };
        convertBtn.disabled = false;
        window.DocuUtils.clearStatus(statusBox);
      }).catch(function(err){
        window.DocuUtils.setStatus(statusBox, 'error', err.message);
      });
    }

    window.DocuUtils.setupDropzone(dropzone, input, handleFiles);

    convertBtn.addEventListener('click', function(){
      if (!current) return;
      convertBtn.disabled = true;
      window.DocuUtils.setStatus(statusBox, 'progress', 'Compressing...');
      var outType = formatSelect.value;
      var quality = parseInt(qualityRange.value, 10) / 100;
      var fillWhite = outType === 'image/jpeg';
      var canvas = window.DocuImage.drawToCanvas(current.img, current.width, current.height, fillWhite);
      window.DocuImage.canvasToBlob(canvas, outType, quality).then(function(blob){
        resultBlob = blob;
        resultImg.src = URL.createObjectURL(blob);
        var originalSize = current.file.size;
        var newSize = blob.size;
        var reduction = originalSize > 0 ? Math.round((1 - (newSize / originalSize)) * 100) : 0;
        compareTable.innerHTML = '';
        [['Original size', window.DocuUtils.formatBytes(originalSize)],
         ['Compressed size', window.DocuUtils.formatBytes(newSize)],
         ['Change', reduction >= 0 ? (reduction + '% smaller') : ((reduction * -1) + '% larger')]
        ].forEach(function(r){
          var tr = document.createElement('tr');
          var th = document.createElement('th'); th.textContent = r[0];
          var td = document.createElement('td'); td.textContent = r[1];
          tr.appendChild(th); tr.appendChild(td);
          compareTable.appendChild(tr);
        });
        if (reduction > 0){
          window.DocuUtils.setStatus(statusBox, 'success', 'Done. Reduced by ' + reduction + '%.');
        } else {
          window.DocuUtils.setStatus(statusBox, 'info', 'This setting did not reduce the file size for this image. Try a lower quality value.');
        }
        resultPanel.style.display = 'block';
        convertBtn.disabled = false;
      }).catch(function(err){
        window.DocuUtils.setStatus(statusBox, 'error', err.message);
        convertBtn.disabled = false;
      });
    });

    downloadBtn.addEventListener('click', function(){
      if (!resultBlob) return;
      var ext = formatSelect.value === 'image/webp' ? 'webp' : 'jpg';
      window.DocuUtils.triggerDownload(resultBlob, window.DocuUtils.safeFilename('docutools-compressed', ext));
    });

    resetBtn.addEventListener('click', resetAll);
    resetAll();
  });
})();
