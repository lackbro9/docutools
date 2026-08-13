/* DocuTools - PDF to Text tool. Extracts selectable text using PDF.js. */
(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded', function(){
    var dropzone = document.getElementById('dropzone');
    var input = document.getElementById('file-input');
    var listEl = document.getElementById('file-list');
    var pageCountLine = document.getElementById('page-count-line');
    var convertBtn = document.getElementById('convert-btn');
    var resetBtn = document.getElementById('reset-btn');
    var statusBox = document.getElementById('status-box');
    var resultPanel = document.getElementById('result-panel');
    var outputArea = document.getElementById('output-text');
    var downloadBtn = document.getElementById('download-btn');
    var currentFile = null;
    var extractedText = '';

    function renderFile(file){
      window.DocuComponents.renderFileList(listEl, file ? [{ id: 'f', label: file.name, sizeText: window.DocuUtils.formatBytes(file.size) }] : [], {
        onRemove: function(){ resetAll(); }, onMoveUp: function(){}, onMoveDown: function(){}
      });
    }

    function resetAll(){
      currentFile = null;
      extractedText = '';
      input.value = '';
      renderFile(null);
      pageCountLine.style.display = 'none';
      convertBtn.disabled = true;
      resultPanel.style.display = 'none';
      outputArea.value = '';
      window.DocuUtils.clearStatus(statusBox);
    }

    function handleFiles(fileList){
      var result = window.DocuUtils.validateFiles(fileList, { acceptExt: ['.pdf'], acceptMime: ['application/pdf'], maxSizeMB: 80, maxFiles: 1 });
      if (result.errors.length){
        window.DocuUtils.setStatus(statusBox, 'error', result.errors.join(' '));
        return;
      }
      currentFile = result.valid[0];
      renderFile(currentFile);
      convertBtn.disabled = false;
      window.DocuUtils.clearStatus(statusBox);
    }

    window.DocuUtils.setupDropzone(dropzone, input, handleFiles);

    convertBtn.addEventListener('click', function(){
      if (!currentFile) return;
      convertBtn.disabled = true;
      window.DocuUtils.setStatus(statusBox, 'progress', 'Extracting text...');
      window.DocuLibs.ensurePdfJs().then(function(pdfjsLib){
        return window.DocuPdf.readAsArrayBuffer(currentFile).then(function(buffer){
          return pdfjsLib.getDocument({ data: buffer }).promise;
        });
      }).then(function(pdf){
        var pagesText = [];
        var chain = Promise.resolve();
        for (var i = 1; i <= pdf.numPages; i++){
          (function(pageNum){
            chain = chain.then(function(){
              return pdf.getPage(pageNum).then(function(page){
                return page.getTextContent().then(function(content){
                  var strings = content.items.map(function(item){ return item.str; });
                  pagesText.push('--- Page ' + pageNum + ' ---\n' + strings.join(' '));
                });
              });
            });
          })(i);
        }
        return chain.then(function(){ return pagesText.join('\n\n'); });
      }).then(function(text){
        extractedText = text.trim();
        outputArea.value = extractedText;
        resultPanel.style.display = 'block';
        convertBtn.disabled = false;
        if (extractedText.length === 0){
          window.DocuUtils.setStatus(statusBox, 'info', 'No selectable text was found. This PDF may be a scanned image; try the OCR tool instead.');
        } else {
          window.DocuUtils.setStatus(statusBox, 'success', 'Done. Extracted ' + extractedText.length + ' characters.');
        }
      }).catch(function(err){
        window.DocuUtils.setStatus(statusBox, 'error', 'Could not read this PDF: ' + err.message);
        convertBtn.disabled = false;
      });
    });

    downloadBtn.addEventListener('click', function(){
      var blob = new Blob([outputArea.value], { type: 'text/plain' });
      window.DocuUtils.triggerDownload(blob, window.DocuUtils.safeFilename('docutools-extracted-text', 'txt'));
    });

    resetBtn.addEventListener('click', resetAll);
    resetAll();
  });
})();
