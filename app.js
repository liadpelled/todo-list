require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const dbURL = "mongodb+srv://" + process.env.MONGOUSER + ":" + process.env.MONGOPW + "@cluster0.gwlov.mongodb.net/todolistDB";

try {
  mongoose.connect(dbURL, {useNewUrlParser: true});
} catch (e) {
  console.log("No connection");
}

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todo list!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to check off an item."
});

const defaultItems = [item1, item2, item3];

const listsSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listsSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){

    if (foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if (err){
          console.log(err);
        } else {
          console.log("Successfully added items.");
        }
      });

      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
    
  });

});

app.get("/:customListName", function(req, res){
  const customListName = req.params.customListName.toLowerCase();

  List.findOne({name: customListName}, async function(err, foundList){
    if (!err){
      if (!foundList){
        const list = new List({
          name: customListName,
          items: defaultItems
        });
  
        await list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {listTitle: _.capitalize(foundList.name), newListItems: foundList.items});
      }
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list.toLowerCase();

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName.toLowerCase();

  if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err){
        console.log("Successfully removed item!");
      }
    });
  
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        console.log("Successfully removed item!");
      }
    });
      
    res.redirect("/" + listName);
  }

});


app.get("/about", function(req, res){
  res.render("about");
});


let port = process.env.PORT;
if (port == null || port == ""){
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully!");
});
