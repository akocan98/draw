function add_event_listeners(){
  // React to mouse events on the canvas, and mouseup on the entire document
  console.log("Canvas context is valid, applying event handlers.");
  canvas.addEventListener('mousedown', sketchpad_mouseDown, false);
  canvas.addEventListener('mousemove', sketchpad_mouseMove, false);
  window.addEventListener('mouseup', sketchpad_mouseUp, false);

  // React to touch events on the canvas
  canvas.addEventListener('touchstart', sketchpad_touchStart, false);
  canvas.addEventListener('touchmove', sketchpad_touchMove, false);
  canvas.addEventListener('touchend', sketchpad_touchEnd, false);
  document.getElementById('canvas_erase').addEventListener('click', function(){ socket_methods.evoke.erase_all() });
  document.getElementById("pen_size_slider").addEventListener('input', function(){ 
    player.pen_tools.size = this.value;  
    //document.getElementById("pen_preview").src = "./../style/cursor/cursor_" + this.value + ".png";
    document.getElementById("pen_preview").style.width = this.value + 'px';
  });

  document.getElementById("chat_form").addEventListener('submit', function(e){ 
    e.preventDefault();
    let text_box = document.getElementById('chat__input');
    let text = text_box.value;
    text_box.value = '';
    socket_methods.evoke.send_chat(text); 
  });

}

function random_number_from(min,max) {
  // min and max included
  return Math.floor(Math.random()*(max-min+1)+min);
}
