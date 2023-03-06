//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { name } = require("ejs");
const _ = require ("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//connect mongoose to mongoDB
mongoose.connect("mongodb://localhost:27017/todolistDB",{
  useNewUrlParser: true,
  // useCreateIndex: true,
  useUnifiedTopology: true
}); //todolist is the name of the database

// Create schema or table columns in sql and it's datatype. 
const itemsSchema = {
  name : {type : String}
};

//create a model base on the schema created. It is the table name and should be singular.
// the table will contain items, so use 'Item'
const Item = mongoose.model("Item", itemsSchema);

//Creating documents to insert
const item1 = {
  name: "Welcome to your todolist."
};

const item2 = {
  name: "Hit the + button to add a new item."
};

const item3 = {
  name: "<-- Hit to delete an item."
};

const defaultitems = [item1, item2, item3]; 

// Schema for a new route
const listSchema = {
  name: String,
  items: [itemsSchema]
};

//model for the listSchema
const List = mongoose.model("List", listSchema);

app.get("/", async function(req, res) {

  try {
    const itemsFound = await Item.find({});
      if (itemsFound.length === 0){ //If items does not exist in the Item model, insert.
          Item.insertMany(defaultitems).then(function(){
              console.log("Data inserted successfully")  // Success
          }).catch(function(error){
                console.log(error)      // Failure
          });
      res.redirect("/");
      } else{ // if items exist, send them to the browser
        res.render("list", {listTitle: "Today", newListItems: itemsFound});
        console.log(itemsFound);
        
      };    
  } catch (err) {
    console.log(err);
  };

  // No more callbacks in mongoose
  // User.find({ name: 'Punit'}, function (err, docs) {
  //   if (err){
  //       console.log(err);
  //   }
  //   else{
  //       console.log("First function call : ", docs);
  //   }
  // });

});


//The new route for to access listSchema. :customListName variable takes any name the user types in.
app.get("/:customListName", async function(req, res){
  
  const customListName = _.capitalize(req.params.customListName); // Use lodash to make first letter capitalized.

  try {
    const listFound = await List.findOne({name: customListName});
      if (!listFound){ //If items does not exist in the List model, insert.
          console.log("List does not exists. Inserted successfully");

        const list = new List({
          name: customListName, // on accessing this,
          items: defaultitems // used to populate our list
        });

        list.save();
        res.redirect("/" + customListName);

      } else{ // if items exist, send them to the browser
        console.log("List exists.");
        res.render("list", {listTitle: listFound.name, newListItems: listFound.items});
      };    
  } catch (err) {
    console.log(err);
  };
});

app.post("/", function(req, res){

  //new item inserted from the input on the browser
  const itemName = req.body.newItem;
  const listName = req.body.list;

  //Goes in here
  const item = new Item({
    name: itemName
  })


  if (listName === "Today"){
    //Save the added item
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}).then(function(listFound){
      listFound.items.push(item);
      listFound.save();
      res.redirect("/" + listName);
      
  }).catch(function(error){
      console.log(error)      // Failure	
  });
  };
  
  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }

});

app.post("/delete", async function(req, res){
  
  try {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName; // for the hidden input

    if (listName === "Today"){
      await Item.findByIdAndRemove({_id: checkedItemId});
      console.log("Item with ", checkedItemId," Id removed")
      res.redirect("/");
    } else {
    //   List.findOneAndUpdate({name: listName}, 
    //     {$pull: {items: {_id: checkedItemId}}}, function (err, listFound) {
    //     if (err){
    //         console.log(err)
    //     }
    //     else{
    //         res.redirect("/" + listName);
    //     }
    // });
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id:checkedItemId}}}).then(function(listFound){
          res.redirect("/" + listName);
          
        }).catch(function(error){
            console.log(error)      // Failure	
        });
    };
          
  } catch (err) {
    console.log(err);
  };
});



app.listen(3000 || process.env.PORT, function() {
  console.log("Server started on port 3000");
});
