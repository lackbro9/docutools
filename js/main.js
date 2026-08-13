/* DocuTools - shared site JS: header, footer, nav, tool registry, utilities */
(function(){
  'use strict';

  var SITE_NAME = 'DocuTools';

  var NAV_LINKS = [
    { href: 'index.html', label: 'Home' },
    { href: 'tools.html', label: 'All Tools' },
    { href: 'about.html', label: 'About' },
    { href: 'contact.html', label: 'Contact' }
  ];

  /* Central tool registry used by homepage, all-tools page, and "related tools" sections */
  var TOOLS = [
    { id:'jpg-to-pdf', name:'JPG to PDF', href:'jpg-to-pdf.html', desc:'Turn one or more JPG photos into a single PDF file.', category:'PDF from images', local:true },
    { id:'images-to-pdf', name:'Images to PDF', href:'images-to-pdf.html', desc:'Combine JPG and PNG images into one ordered PDF.', category:'PDF from images', local:true },
    { id:'pdf-to-jpg', name:'PDF to JPG', href:'pdf-to-jpg.html', desc:'Convert PDF pages into downloadable JPG images.', category:'PDF from images', local:true },
    { id:'merge-pdf', name:'Merge PDF', href:'merge-pdf.html', desc:'Combine multiple PDF files into one document, in any order.', category:'Organize PDF', local:true },
    { id:'split-pdf', name:'Split PDF', href:'split-pdf.html', desc:'Pull a page range out of a PDF into a new file.', category:'Organize PDF', local:true },
    { id:'pdf-page-extractor', name:'PDF Page Extractor', href:'pdf-page-extractor.html', desc:'Pick exact pages from a PDF and save them as a new PDF.', category:'Organize PDF', local:true },
    { id:'compress-pdf', name:'Compress PDF', href:'compress-pdf.html', desc:'Reduce PDF file size with real, measured optimization.', category:'Organize PDF', local:true, limited:true },
    { id:'pdf-to-text', name:'PDF to Text', href:'pdf-to-text.html', desc:'Extract selectable text from a text-based PDF.', category:'Convert & extract', local:true, limited:true },
    { id:'text-to-pdf', name:'Text to PDF', href:'text-to-pdf.html', desc:'Turn plain text into a nicely formatted PDF.', category:'Convert & extract', local:true },
    { id:'image-resizer', name:'Image Resizer', href:'image-resizer.html', desc:'Resize JPG, PNG or WebP images by exact width and height.', category:'Image tools', local:true },
    { id:'image-compressor', name:'Image Compressor', href:'image-compressor.html', desc:'Shrink image file size by adjusting quality, right in your browser.', category:'Image tools', local:true },
    { id:'jpg-to-png', name:'JPG to PNG', href:'jpg-to-png.html', desc:'Convert JPG photos to the PNG format.', category:'Image tools', local:true },
    { id:'png-to-jpg', name:'PNG to JPG', href:'png-to-jpg.html', desc:'Convert PNG images to the JPG format.', category:'Image tools', local:true },
    { id:'ocr', name:'OCR - Image to Text', href:'ocr.html', desc:'Extract text from a photo or scanned image using on-device OCR.', category:'Convert & extract', local:true, limited:true }
  ];
  window.DOCUTOOLS_TOOLS = TOOLS;

  function el(tag, attrs, children){
    var node = document.createElement(tag);
    if (attrs){
      Object.keys(attrs).forEach(function(key){
        if (key === 'class') node.className = attrs[key];
        else if (key === 'text') node.textContent = attrs[key];
        else node.setAttribute(key, attrs[key]);
      });
    }
    if (children){
      children.forEach(function(child){
        if (child) node.appendChild(child);
      });
    }
    return node;
  }
  window.DocuEl = el;

  function buildHeader(activeHref){
    var header = el('header', { class: 'site-header' });
    var container = el('div', { class: 'container' });

    var logo = el('a', { href: 'index.html', class: 'logo' }, [
      el('span', { class: 'logo-mark', text: 'DT' }),
      el('span', { text: SITE_NAME })
    ]);

    var toggle = el('button', { class: 'nav-toggle', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'main-nav', 'aria-label': 'Toggle navigation menu' }, [
      el('span', { class: 'nav-toggle-bar' }), el('span', { class: 'nav-toggle-bar' }), el('span', { class: 'nav-toggle-bar' })
    ]);

    var nav = el('nav', { class: 'main-nav', id: 'main-nav', 'aria-label': 'Primary' });
    NAV_LINKS.forEach(function(link){
      var a = el('a', { href: link.href, text: link.label });
      if (link.href === activeHref) a.setAttribute('aria-current', 'page');
      nav.appendChild(a);
    });

    toggle.addEventListener('click', function(){
      var isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    container.appendChild(logo);
    container.appendChild(nav);
    container.appendChild(toggle);
    header.appendChild(container);
    return header;
  }

  function buildFooter(){
    var footer = el('footer', { class: 'site-footer' });
    var container = el('div', { class: 'container' });
    var grid = el('div', { class: 'footer-grid' });

    var columns = [
      { title: 'Tools', links: [
        { href: 'merge-pdf.html', label: 'Merge PDF' },
        { href: 'split-pdf.html', label: 'Split PDF' },
        { href: 'jpg-to-pdf.html', label: 'JPG to PDF' },
        { href: 'pdf-to-jpg.html', label: 'PDF to JPG' },
        { href: 'tools.html', label: 'All tools' }
      ]},
      { title: 'Convert', links: [
        { href: 'pdf-to-text.html', label: 'PDF to Text' },
        { href: 'text-to-pdf.html', label: 'Text to PDF' },
        { href: 'jpg-to-png.html', label: 'JPG to PNG' },
        { href: 'ocr.html', label: 'OCR' }
      ]},
      { title: 'Company', links: [
        { href: 'about.html', label: 'About' },
        { href: 'contact.html', label: 'Contact' }
      ]},
      { title: 'Legal', links: [
        { href: 'privacy.html', label: 'Privacy Policy' },
        { href: 'terms.html', label: 'Terms of Service' }
      ]}
    ];

    columns.forEach(function(col){
      var ul = el('ul');
      col.links.forEach(function(link){ ul.appendChild(el('li', {}, [el('a', { href: link.href, text: link.label })])); });
      grid.appendChild(el('div', {}, [el('h4', { text: col.title }), ul]));
    });

    var bottom = el('div', { class: 'footer-bottom' }, [
      el('span', { text: '(c) ' + new Date().getFullYear() + ' ' + SITE_NAME + '. Files are processed in your browser for tools marked Local.' }),
      el('span', { text: 'Built with HTML, CSS and vanilla JavaScript.' })
    ]);

    container.appendChild(grid);
    container.appendChild(bottom);
    footer.appendChild(container);
    return footer;
  }

  function mountLayout(){
    var headerSlot = document.getElementById('site-header');
    var footerSlot = document.getElementById('site-footer');
    var activeHref = document.body.getAttribute('data-active') || '';
    if (headerSlot) headerSlot.appendChild(buildHeader(activeHref));
    if (footerSlot) footerSlot.appendChild(buildFooter());
  }

  document.addEventListener('DOMContentLoaded', mountLayout);

  /* ---------- Shared utilities used by every tool page ---------- */

  function formatBytes(bytes){
    if (bytes === 0 || bytes === undefined || bytes === null || isNaN(bytes)) return '0 B';
    var units = ['B','KB','MB','GB'];
    var i = 0;
    var value = bytes;
    while (value >= 1024 && i < units.length - 1){ value = value / 1024; i++; }
    return (i === 0 ? value : value.toFixed(2)) + ' ' + units[i];
  }

  function setStatus(box, type, message){
    if (!box) return;
    box.className = 'status-box visible status-' + type;
    box.textContent = message;
    box.setAttribute('role', type === 'error' ? 'alert' : 'status');
  }

  function clearStatus(box){
    if (!box) return;
    box.className = 'status-box';
    box.textContent = '';
  }

  function validateFiles(files, options){
    options = options || {};
    var maxSizeMB = options.maxSizeMB || 40;
    var maxFiles = options.maxFiles || 30;
    var acceptExt = options.acceptExt || null; /* array like ['.jpg','.jpeg'] */
    var acceptMime = options.acceptMime || null; /* array like ['image/jpeg'] */
    var errors = [];
    var valid = [];

    if (!files || files.length === 0){
      errors.push('Please choose at least one file.');
      return { valid: valid, errors: errors };
    }
    if (files.length > maxFiles){
      errors.push('You can select up to ' + maxFiles + ' files at a time.');
      return { valid: [], errors: errors };
    }
    Array.prototype.forEach.call(files, function(file){
      var lowerName = (file.name || '').toLowerCase();
      var extOk = true;
      if (acceptExt){
        extOk = acceptExt.some(function(ext){ return lowerName.endsWith(ext); });
      }
      var mimeOk = true;
      if (acceptMime){
        mimeOk = acceptMime.indexOf(file.type) !== -1;
      }
      if (!extOk && !mimeOk){
        errors.push(file.name + ': unsupported file type.');
        return;
      }
      if (file.size === 0){
        errors.push(file.name + ': file is empty.');
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024){
        errors.push(file.name + ': exceeds the ' + maxSizeMB + ' MB size limit for this tool.');
        return;
      }
      valid.push(file);
    });
    return { valid: valid, errors: errors };
  }

  function setupDropzone(dropzone, input, onFiles){
    if (!dropzone || !input) return;
    dropzone.addEventListener('click', function(){ input.click(); });
    dropzone.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); input.click(); }
    });
    ['dragenter','dragover'].forEach(function(evt){
      dropzone.addEventListener(evt, function(e){ e.preventDefault(); dropzone.classList.add('dragover'); });
    });
    ['dragleave','drop'].forEach(function(evt){
      dropzone.addEventListener(evt, function(e){ e.preventDefault(); dropzone.classList.remove('dragover'); });
    });
    dropzone.addEventListener('drop', function(e){
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length){
        onFiles(e.dataTransfer.files);
      }
    });
    input.addEventListener('change', function(){
      if (input.files && input.files.length) onFiles(input.files);
    });
  }

  function triggerDownload(blob, filename){
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 30000);
  }

  function safeFilename(base, ext){
    var cleaned = (base || 'download').replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!cleaned) cleaned = 'download';
    return cleaned + '.' + ext;
  }

  /* Loads a script from a CDN with fallback CDNs; returns a Promise */
  function loadScriptWithFallback(urls){
    return new Promise(function(resolve, reject){
      var i = 0;
      function tryNext(){
        if (i >= urls.length){ reject(new Error('All CDN sources failed to load.')); return; }
        var url = urls[i++];
        var existing = document.querySelector('script[data-cdn-src="' + url + '"]');
        if (existing){ resolve(); return; }
        var script = document.createElement('script');
        script.src = url;
        script.setAttribute('data-cdn-src', url);
        script.onload = function(){ resolve(); };
        script.onerror = function(){ script.remove(); tryNext(); };
        document.head.appendChild(script);
      }
      tryNext();
    });
  }

  window.DocuUtils = {
    formatBytes: formatBytes,
    setStatus: setStatus,
    clearStatus: clearStatus,
    validateFiles: validateFiles,
    setupDropzone: setupDropzone,
    triggerDownload: triggerDownload,
    safeFilename: safeFilename,
    loadScriptWithFallback: loadScriptWithFallback,
    el: el
  };

  /* ---------- Tool search (used on homepage and All Tools page) ---------- */
  function setupToolSearch(){
    var input = document.getElementById('tool-search-input');
    if (!input) return;
    var cards = document.querySelectorAll('[data-tool-card]');
    input.addEventListener('input', function(){
      var q = input.value.trim().toLowerCase();
      cards.forEach(function(card){
        var haystack = (card.getAttribute('data-tool-name') || '').toLowerCase();
        card.style.display = (!q || haystack.indexOf(q) !== -1) ? '' : 'none';
      });
    });
  }
  document.addEventListener('DOMContentLoaded', setupToolSearch);

})();
