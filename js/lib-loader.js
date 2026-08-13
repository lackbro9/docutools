/* DocuTools - dynamic CDN library loader with fallbacks.
   Heavy libraries are only fetched when a tool actually needs them (lazy loading). */
(function(){
  'use strict';

  var CDN = {
    pdfLib: [
      'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',
      'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
      'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js'
    ],
    pdfjs: [
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
      'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js'
    ],
    pdfjsWorker: [
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js',
      'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
    ],
    jszip: [
      'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
      'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
      'https://unpkg.com/jszip@3.10.1/dist/jszip.min.js'
    ],
    tesseract: [
      'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js',
      'https://cdn.jsdelivr.net/npm/tesseract.js@4.1.1/dist/tesseract.min.js',
      'https://unpkg.com/tesseract.js@4.1.1/dist/tesseract.min.js'
    ]
  };

  function ensurePdfLib(){
    if (window.PDFLib) return Promise.resolve(window.PDFLib);
    return window.DocuUtils.loadScriptWithFallback(CDN.pdfLib).then(function(){ return window.PDFLib; });
  }

  function ensurePdfJs(){
    if (window.pdfjsLib){
      return Promise.resolve(window.pdfjsLib);
    }
    return window.DocuUtils.loadScriptWithFallback(CDN.pdfjs).then(function(){
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN.pdfjsWorker[0];
      return window.pdfjsLib;
    });
  }

  function ensureJsZip(){
    if (window.JSZip) return Promise.resolve(window.JSZip);
    return window.DocuUtils.loadScriptWithFallback(CDN.jszip).then(function(){ return window.JSZip; });
  }

  function ensureTesseract(){
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    return window.DocuUtils.loadScriptWithFallback(CDN.tesseract).then(function(){ return window.Tesseract; });
  }

  window.DocuLibs = {
    ensurePdfLib: ensurePdfLib,
    ensurePdfJs: ensurePdfJs,
    ensureJsZip: ensureJsZip,
    ensureTesseract: ensureTesseract
  };
})();
