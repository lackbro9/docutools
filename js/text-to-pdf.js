/* DocuTools - Text to PDF tool. Wraps plain text across pages using pdf-lib. */
(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded', function(){
    var textArea = document.getElementById('text-input');
    var pageSizeSelect = document.getElementById('page-size-select');
    var fontSizeSelect = document.getElementById('font-size-select');
    var convertBtn = document.getElementById('convert-btn');
    var resetBtn = document.getElementById('reset-btn');
    var statusBox = document.getElementById('status-box');
    var resultPanel = document.getElementById('result-panel');
    var resultSummary = document.getElementById('result-summary');
    var downloadBtn = document.getElementById('download-btn');
    var resultBlob = null;

    var PAGE_SIZES = { a4: [595.28, 841.89], letter: [612, 792] };
    var MARGIN = 56;

    function wrapLine(line, font, fontSize, maxWidth){
      if (line === '') return [''];
      var words = line.split(' ');
      var lines = [];
      var current = '';
      words.forEach(function(word){
        var candidate = current ? current + ' ' + word : word;
        if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth || current === ''){
          current = candidate;
        } else {
          lines.push(current);
          current = word;
        }
      });
      if (current) lines.push(current);
      return lines;
    }

    convertBtn.addEventListener('click', function(){
      var text = textArea.value;
      if (!text.trim()){
        window.DocuUtils.setStatus(statusBox, 'error', 'Please enter some text first.');
        return;
      }
      convertBtn.disabled = true;
      window.DocuUtils.setStatus(statusBox, 'progress', 'Building PDF...');

      window.DocuLibs.ensurePdfLib().then(function(PDFLib){
        var pageSize = PAGE_SIZES[pageSizeSelect.value] || PAGE_SIZES.a4;
        var fontSize = parseInt(fontSizeSelect.value, 10) || 12;
        var lineHeight = fontSize * 1.4;

        return PDFLib.PDFDocument.create().then(function(pdfDoc){
          return pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica).then(function(font){
            var maxWidth = pageSize[0] - MARGIN * 2;
            var rawLines = text.replace(/\r\n/g, '\n').split('\n');
            var wrapped = [];
            rawLines.forEach(function(line){
              wrapLine(line, font, fontSize, maxWidth).forEach(function(l){ wrapped.push(l); });
            });

            var page = pdfDoc.addPage(pageSize);
            var y = pageSize[1] - MARGIN;
            wrapped.forEach(function(line){
              if (y < MARGIN){
                page = pdfDoc.addPage(pageSize);
                y = pageSize[1] - MARGIN;
              }
              page.drawText(line, { x: MARGIN, y: y, size: fontSize, font: font });
              y -= lineHeight;
            });
            return pdfDoc.save();
          });
        });
      }).then(function(bytes){
        resultBlob = new Blob([bytes], { type: 'application/pdf' });
        resultSummary.textContent = 'File size: ' + window.DocuUtils.formatBytes(resultBlob.size);
        window.DocuUtils.setStatus(statusBox, 'success', 'Done.');
        resultPanel.style.display = 'block';
        convertBtn.disabled = false;
      }).catch(function(err){
        window.DocuUtils.setStatus(statusBox, 'error', 'Could not build the PDF: ' + err.message);
        convertBtn.disabled = false;
      });
    });

    downloadBtn.addEventListener('click', function(){
      if (resultBlob) window.DocuUtils.triggerDownload(resultBlob, window.DocuUtils.safeFilename('docutools-text', 'pdf'));
    });

    resetBtn.addEventListener('click', function(){
      textArea.value = '';
      resultBlob = null;
      resultPanel.style.display = 'none';
      window.DocuUtils.clearStatus(statusBox);
    });
  });
})();
