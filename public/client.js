var socket; 
var canvas, ctx = false;

var player = {

   pen_tools : {
      size : 5,
      color : '#000000',
      bucketing : false,
      rainbow : {
         hue : 0
      }, //
      available_colors : [
         // top
         '#EF130B',
         '#FF7100',
         '#FFE400',
         '#00CC00',
         '#00B2FF',
         '#231FD3',
         '#A300BA',
         '#D37CAA',
         '#C67943',
         '#6C6C6C',
         // bottom
         //'rainbow',
         '#740B07',
         '#C23800',
         '#E8A200',
         '#005510',
         '#00569E',
         '#0E0865',
         '#550069',
         '#A75574',
         '#63300D',
         '#000000',
      ]
   },

   touchX : null,
   touchY : null,

   mouseX : false, 
   mouseY : false, 

   prev_mouseX : false, 
   prev_mouseY : false, 

   mouseDown : false,
   line_index : 0
};

var socket_methods = {
   // On receive from server
   on_receive : {
      erase_all : function(){
         ctx.clearRect(0, 0, canvas.width, canvas.height);
      },
      draw_history : function(lines){

         ctx.save();
         ctx.clearRect(0, 0, canvas.width, canvas.height);

         for(var i in lines){

            line = lines[i]

            ctx.strokeStyle = line[2].color;
            ctx.lineWidth = line[2].size;
            
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            ctx.beginPath();

            ctx.moveTo(line[1].x , line[1].y);
            ctx.lineTo(line[0].x, line[0].y);
            ctx.stroke();

            ctx.closePath();
         }

         ctx.restore();
      },
      draw : function(line){
         //coords = line[0];
         //prev_coords = line[1];
         //draw_tools = line[2];

         ctx.strokeStyle = line[2].color;
         ctx.lineWidth = line[2].size;
         
         ctx.lineJoin = 'round';
         ctx.lineCap = 'round';

         ctx.beginPath();

         ctx.moveTo(line[1].x , line[1].y);
         ctx.lineTo(line[0].x, line[0].y);
         ctx.stroke();

         ctx.closePath();
      },
      draw_users : function(players){

         var users_container = document.getElementById('users');
         users_container.innerHTML = '';

         players.forEach(function(element) {
               var user_div = document.createElement("div");
               var user_info = document.createElement("div");
              
               user_div.classList.add('user');

               // Username & points
               var user_name = document.createElement("div");
               var tmp_name_tag = element.name;
      
               if(element.id == socket.id) {
                  tmp_name_tag += " (You)";
               } 
               user_name.innerHTML = tmp_name_tag;

               user_name.classList.add('name');

               var user_points = document.createElement("div");
               user_points.innerHTML = '0 Points';
               user_points.classList.add('points');

               // Profile picture
               user_profile_pic = document.createElement("img");
               user_profile_pic.src = './style/avatars/' + (element.avatar) + '.png';
               user_profile_pic.classList.add('avatar');

               user_info.appendChild(user_name);
               user_info.appendChild(user_points);

               user_div.appendChild(user_profile_pic);
               user_div.appendChild(user_info);

               users_container.appendChild(user_div);
         });
        
      },
      //<div class="chat_text"> User1: Sample text </div>
      append_to_chat : function(data){
         var chat_history = document.getElementById('chat__history');

         let new_chat_div = document.createElement('div');
         new_chat_div.classList.add('chat_text');
         new_chat_div.innerHTML = data.name + ": " + data.text;
         chat_history.appendChild(new_chat_div);

         chat_history.scrollTop = chat_history.scrollHeight;
      },
      append_to_chat_styled : function(data){
         var chat_history = document.getElementById('chat__history');

         let new_chat_div = document.createElement('div');
         new_chat_div.classList.add('chat_text');
         new_chat_div.innerHTML = data.text;
         chat_history.appendChild(new_chat_div);
         chat_history.scrollTop = chat_history.scrollHeight;

      },
      nullify : function(){
         return null;
      }
   },

   // Evoke to server
   evoke : {
      erase_all : function(){
         socket.emit('erase_all');
      },
      undo_line : function(){
         socket.emit('undo_line');
      },
      emitDotDraw : function(ctx, x, y, prev_x, prev_y, color, size){

         if(player.pen_tools.bucketing){

            socket.emit('paint_bucket', { line: 
               [
                  {x : x, y : y}, //current coordinates
                  {color : color, size : size},
                  {lineIndex : player.line_index} //draw settings
               ]
            });

            return;
         }

         if(player.pen_tools.color == 'rainbow'){
            hue = player.pen_tools.rainbow.hue;
            color = "hsla("+hue+","+100+"%,"+50+"%,"+1+")";
            
            player.pen_tools.rainbow.hue += 2;

            if(hue > 360){
               player.pen_tools.rainbow.hue = 0;
            }
         }
         socket.emit('draw_line', { line: 
            [
               {x : x, y : y}, //current coordinates
               {x : prev_x, y : prev_y}, //previous coordinates
               {color : color, size : size},
               {lineIndex : player.line_index} //draw settings
            ]
         });
      },
      send_chat : function(text){
         socket.emit('send_chat', { name : socket.name, text : text });
      },
      nullify : function(){
         return null;
      }
   }
}

function pen_toolbar_init(){
   var eraser = document.createElement("div");
   var trash = document.createElement("div");
   var paint_bucket = document.createElement("div");
   var undo = document.createElement('div');

   trash.id = 'canvas_erase';
   eraser.id = 'eraser';
   paint_bucket.id = 'paint_bucket';
   undo.id = "undo";

   eraser.classList.add('color');
   trash.classList.add('color');
   paint_bucket.classList.add('color');
   undo.classList.add("color");

   var trash_img = document.createElement("img");
   var undo_img = document.createElement("img");
   var eraser_img = document.createElement("img");
   var paint_bucket_img = document.createElement("img");

   undo_img.src = './style/pen_tools/undo.png';
   trash_img.src = './style/pen_tools/trash.png';
   eraser_img.src = './style/pen_tools/eraser.png';
   paint_bucket_img.src = './style/pen_tools/paint-bucket.png';

   undo.addEventListener('click', function(){
      socket_methods.evoke.undo_line();
   });

   eraser.addEventListener('click', function(){
      player.pen_tools.color = '#FFFFFF';
      player.pen_tools.bucketing = false;
   });

   paint_bucket.addEventListener('click', function(){
      player.pen_tools.bucketing = true;
   });

   undo.appendChild(undo_img);   
   trash.appendChild(trash_img);
   eraser.appendChild(eraser_img);
   paint_bucket.appendChild(paint_bucket_img);


   var color_picker = document.getElementById('color_picker');

   var color_picker_left_col = document.createElement("div");
   var color_picker_right_col = document.createElement("div");

   color_picker_left_col.classList.add("col--col_left");
   color_picker_right_col.classList.add("col--col_right");

   for(var i = 0; i < player.pen_tools.available_colors.length; i++){

      // Create new Div.Color DOM el.
      var color = document.createElement("div");
      color.classList.add('color');
      color.dataset.color = player.pen_tools.available_colors[i];
      if(color.dataset.color == 'rainbow'){

         color.id = "rainbow";
      } else {
         color.style.backgroundColor = player.pen_tools.available_colors[i];
      }
      color.addEventListener('click', function(){
         player.pen_tools.bucketing = false;
         if(this.dataset.color == 'rainbow'){
            player.pen_tools.color = "rainbow";
            document.getElementById("pen_preview").classList.add('rainbow');
         }else {
            player.pen_tools.color = this.dataset.color;
            document.getElementById("pen_preview").classList.remove('rainbow');
            player.pen_tools.rainbow.hue = 0;
            document.getElementById("pen_preview").style.backgroundColor = this.dataset.color;
         }
      });

      // Determine it's column
      if(i <  player.pen_tools.available_colors.length / 2){
         color_picker_left_col.appendChild(color);
      } else {
         color_picker_right_col.appendChild(color);
      }
   }


   // Append extras
   color_picker_left_col.appendChild(eraser);
   color_picker_left_col.appendChild(paint_bucket);
   color_picker_right_col.appendChild(trash);
   color_picker_right_col.appendChild(undo);

   color_picker.appendChild(color_picker_left_col);
   color_picker.appendChild(color_picker_right_col);   

   
   if(ctx) {
      add_event_listeners();
   }
}

// Set-up the canvas and add our event handlers after the page has loaded
function __init() {
   // {transports: ['websocket'], upgrade: false} forces socket.io to only use a websocket and never use http polling
   socket  = io.connect({transports: ['websocket'], upgrade: false});

   canvas = document.getElementById('sketchpad');

   if(canvas.getContext){
      ctx = canvas.getContext('2d');
   }

   pen_toolbar_init();

   socket.on('draw', function (data) {
      socket_methods.on_receive.draw(data.line);
   });

   socket.on('draw_history', function (data) {
      socket_methods.on_receive.draw_history(data.lines);
   });

   socket.on('erase_all', function (data) {
      socket_methods.on_receive.erase_all();
   });

   socket.on('socket_credentials', function(data){
      socket.id = data.id;
      socket.name = data.name;
   });

   socket.on('draw_users', function(data) {
      document.getElementById('lobby_name').innerHTML = "ROOM ID: " + data.room.id; // + data.room.name.toUpperCase() + " (" + data.room.id + ")";
      socket_methods.on_receive.draw_users(data.room.players);
   });

   socket.on('append_to_chat', function(data) {
      socket_methods.on_receive.append_to_chat(data);
   });

   socket.on('append_to_chat_styled', function(data) {
      socket_methods.on_receive.append_to_chat_styled(data);
   });
}

document.addEventListener("DOMContentLoaded", function(event) {
   console.log("DOM fully loaded and parsed");
   __init();
});
