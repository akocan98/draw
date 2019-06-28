function sketchpad_mouseDown() {
   player.mouseDown = true;
   socket_methods.evoke.emitDotDraw(ctx, player.mouseX, player.mouseY, player.prev_mouseX, player.prev_mouseY, player.pen_tools.color, player.pen_tools.size);
   player.prev_mouseX = player.mouseX;
   player.prev_mouseY = player.mouseY;
}

// Keep track of the mouse button being released
function sketchpad_mouseUp() {
   player.mouseDown = false;
   player.line_index++;
}

// Keep track of the mouse position and draw a dot if mouse button is currently pressed
function sketchpad_mouseMove(e) {
   // Update the mouse co-ordinates when moved
   getMousePos(e);

   // Draw a dot if the mouse button is currently being pressed
   if(player.mouseDown) {
      socket_methods.evoke.emitDotDraw(ctx, player.mouseX, player.mouseY, player.prev_mouseX, player.prev_mouseY, player.pen_tools.color, player.pen_tools.size);
   }
   player.prev_mouseX = player.mouseX;
   player.prev_mouseY = player.mouseY;
}

// Get the current mouse position relative to the top-left of the canvas
function getMousePos(e) {
   if(!e)
      var e = event;

   if(e.offsetX) {
      player.mouseX = e.offsetX;
      player.mouseY = e.offsetY;
   } else if(e.layerX) {
      player.mouseX = e.layerX;
      player.mouseY = e.layerY;
   }
}

function sketchpad_touchEnd(e){
   player.line_index++;
}

// Draw something when a touch start is detected
function sketchpad_touchStart(e) {
   getTouchPos(e);
   player.prev_mouseX = player.touchX;
   player.prev_mouseY = player.touchY;
   // Update the touch co-ordinates
   if(e.touches[0].force == 0.5){
      console.log("Please use a stylus or mouse.")
   }
   else{
      getTouchPos(e);
      //console.log(e.touches[0].forcmite);
      socket_methods.evoke.emitDotDraw(ctx, player.touchX, player.touchY, player.prev_mouseX, player.prev_mouseY, player.pen_tools.color, player.pen_tools.size);
      player.prev_mouseX = player.touchX;
      player.prev_mouseY = player.touchY;
      // Prevents an additional mousedown event being triggered      
   }
   event.preventDefault();
}

// Draw something and prevent the default scrolling when touch movement is detected
function sketchpad_touchMove(e) {
   if(e.touches[0].force == 0.5){
      player.prev_mouseX = player.touchX;
      player.prev_mouseY = player.touchY;
      return
   }

   // Update the touch co-ordinates
   getTouchPos(e);

   // During a touchmove event, unlike a mousemove event, we don't need to check if the touch is engaged, since there will always be contact with the screen by definition.
   socket_methods.evoke.emitDotDraw(ctx, player.touchX, player.touchY, player.prev_mouseX, player.prev_mouseY, player.pen_tools.color, player.pen_tools.size);
   player.prev_mouseX = player.touchX;
   player.prev_mouseY = player.touchY;
   // Prevent a scrolling action as a result of this touchmove triggering.
   event.preventDefault();
}

// Get the touch position relative to the top-left of the canvas
// When we get the raw values of pageX and pageY below, they take into account the scrolling on the page
// but not the position relative to our target div. We'll adjust them using "target.offsetLeft" and
// "target.offsetTop" to get the correct values in relation to the top left of the canvas.
function getTouchPos(e) {
   if(!e)
      var e = event;

   if(e.touches) {
      if(e.touches.length == 1) { // Only deal with one finger
         var touch = e.touches[0]; // Get the information for finger #1
         player.touchX = touch.pageX - touch.target.offsetLeft;
         player.touchY = touch.pageY - touch.target.offsetTop;
      }
   }
}
