var express = require("express");
var mongoose = require("mongoose");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io").listen(server);
var port = 3013 ;
server.listen(port);
mongoose.connect('mongodb://localhost/questions_db');
console.log("Server is running in", port);
app.get("/", function(req, res){
  res.sendfile(__dirname + "/index.html");
});
app.get("/about", function(req, res){
  res.sendfile(__dirname + "/about.html");
});
var Schema = mongoose.Schema;
var questionSchema = new Schema({
  questionNumber : Number,
  question : String,
  selections : [],
  correctAnswer : Number
});
var Questions = mongoose.model("questions", questionSchema);
io.sockets.on("connection", function(socket){
  var counter = 1;
  socket.testResult = {correct : 0, wrong : 0, success: 0};
  socket.on("user-selection", function(selection, callback){
    if (socket.question.selections[socket.question.correctAnswer] == selection){
      socket.testResult.correct++;
      callback({result : true, correctAnswer : socket.question.correctAnswer});
    }else {
      socket.testResult.wrong++;
      callback({result : false, correctAnswer : socket.question.correctAnswer});
    }
  });
  socket.on("request-new-question", function(){
    newQuestion(counter, socket);
    counter++;
  })
});

function newQuestion(questionNumber, socket){
  Questions.findOne({questionNumber : questionNumber}, function(err, question){
    if (question == null){
      socket.testResult.success = (socket.testResult.correct * 100) /
                                  (socket.testResult.correct + socket.testResult.wrong);
      socket.emit("test-result", socket.testResult);
    }else{
      socket.question = question;
      socket.emit("new-question", question);
    }
  });
}
