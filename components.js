/* DocuTools - reusable UI components shared across tool pages */
(function(){
  'use strict';
  var el = window.DocuEl;

  /* Renders an ordered list of files with optional thumbnail, move up/down and remove controls.
     items: array of { id, label, sizeText, thumbSrc (optional) }
     handlers: { onRemove(id), onMoveUp(id), onMoveDown(id) } */
  function renderFileList(ulEl, items, handlers){
    ulEl.textContent = '';
    items.forEach(function(item, index){
      var controls = [];
      if (item.thumbSrc){
        var img = document.createElement('img');
        img.className = 'thumb';
        img.src = item.thumbSrc;
        img.alt = '';
        controls.push(img);
      }
      controls.push(el('span', { class: 'file-name', text: item.label }));
      controls.push(el('span', { class: 'file-size', text: item.sizeText || '' }));

      var upBtn = el('button', { type: 'button', class: 'file-move', 'aria-label': 'Move ' + item.label + ' up', text: '\u2191' });
      upBtn.disabled = index === 0;
      upBtn.addEventListener('click', function(){ handlers.onMoveUp(item.id); });
      controls.push(upBtn);

      var downBtn = el('button', { type: 'button', class: 'file-move', 'aria-label': 'Move ' + item.label + ' down', text: '\u2193' });
      downBtn.disabled = index === items.length - 1;
      downBtn.addEventListener('click', function(){ handlers.onMoveDown(item.id); });
      controls.push(downBtn);

      var removeBtn = el('button', { type: 'button', class: 'file-remove', text: 'Remove' });
      removeBtn.addEventListener('click', function(){ handlers.onRemove(item.id); });
      controls.push(removeBtn);

      ulEl.appendChild(el('li', {}, controls));
    });
  }

  function moveItem(array, id, direction){
    var index = array.findIndex(function(item){ return item.id === id; });
    if (index === -1) return array;
    var newIndex = index + direction;
    if (newIndex < 0 || newIndex >= array.length) return array;
    var copy = array.slice();
    var temp = copy[index];
    copy[index] = copy[newIndex];
    copy[newIndex] = temp;
    return copy;
  }

  var idCounter = 0;
  function nextId(){ idCounter++; return 'f' + Date.now() + '-' + idCounter; }

  window.DocuComponents = {
    renderFileList: renderFileList,
    moveItem: moveItem,
    nextId: nextId
  };
})();
