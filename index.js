const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

const port = process.env.PORT || 8000;

// middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qlvqjvw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // auth related api

    // all collection
    const usersCollection = client.db("school-managment").collection("users");
    const teacherCollection = client
      .db("school-managment")
      .collection("teachers");
    const ClassshedulesCollection = client
      .db("school-managment")
      .collection("classShedules");
    const studentCollection = client
      .db("school-managment")
      .collection("allStudents");

    // token genarate
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCES_TOKEN, {
        expiresIn: "1hr",
      });
      //   console.log("token", token);
      res.send({ token });
    });
    // user svaed database and updated user
    app.put("/users", async (req, res) => {
      const user = req.body;
      //   console.log(user);
      const query = { email: user?.email };
      //   console.log(query);
      // Check if the user exists
      const isExist = await usersCollection.findOne(query);
      if (isExist) {
        return res.send(isExist);
      } else {
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            ...user,
            timestamp: Date.now(),
          },
        };
        const result = await usersCollection.updateOne(
          query,
          updateDoc,
          options
        );
        res.send(result);
      }
    });
    // get all users
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    // admin role chack
    app.get("/user/:email", async (req, res) => {
      const user = req.body;
      //   console.log(user);
      const email = req.params.email;
      const query = { email };
      //   console.log(query);
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    // add teacher
    app.post("/add-teacher", async (req, res) => {
      const teacher = req.body;
      // console.log(teacher);
      const result = await teacherCollection.insertOne(teacher);
      res.send(result);
    });
    // acces teacher and admin
    app.get("/all-teacher", async (req, res) => {
      const result = await teacherCollection.find().toArray();
      res.send(result);
    });
    // acces admin upded teacher
    app.patch("/teacher/:id", async (req, res) => {
      const id = req.params.id;
      const teacher = req.body;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          name: teacher.name,
          admissionNumber: teacher.admissionNumber,
          subject: teacher.subject,
          date: teacher.date,
          gender: teacher.gender,
          email: teacher.email,
          joiningDate: teacher.joiningDate,
          image: teacher.image,
        },
      };
      const result = await teacherCollection.updateOne(query, updatedDoc);
      res.send(result);
    });
    // delete teacher accces admin
    app.delete("/teacher/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await teacherCollection.deleteOne(query);
      res.send(result);
    });

    // get class shedules
    app.get("/class-shudels", async (req, res) => {
      const result = await ClassshedulesCollection.find().toArray();
      res.send(result);
    });

    app.post("/all-student", async (req, res) => {
      const student = req.body;
      console.log(student);
      const result = await studentCollection.insertOne(student);
      res.send(result);
    });
    app.get("/all-student", async (req, res) => {
      const result = await studentCollection.find().toArray();
      res.send(result);
    });
    app.get("/all-student/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await studentCollection.findOne(query);
      res.send(result);
    });
    app.delete("/student/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await studentCollection.deleteOne(query);
      res.send(result);
    });
    // update student
    app.patch("/student/:id", async (req, res) => {
      const id = req.params.id;
      const student = req.body;
      // console.log("student", student);
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          name: student.name,
          className: student.className,
          date: student.date,
          gender: student.gender,
          rollNumber: student.rollNumber,
          email: student.email,
          validity: student.validity,
          image: student.image,
        },
      };
      const result = await studentCollection.updateOne(query, updatedDoc);
      // console.log("result", result);
      res.send(result);
    });

    // assingmetn add by teacher
    app.patch("/all-student", (req, res) => {
      const {
        classSelected,
        assignmentDetails,
        assignmentName,
        submitDate,
        lastDate,
      } = req.body;
      // console.log(req.body);
      // Update all students in the selected class with the new assignment details
      studentCollection
        .updateMany(
          { className: classSelected }, // Matching students by class
          {
            $set: {
              assignmentDetails,
              assignmentName,
              submitDate,
              lastDate,
            },
          }
        )
        .then((result) => {
          res.send({
            success: true,
            message: "Assignment updated successfully",
            result,
          });
        })
        .catch((error) => {
          console.error("Error updating assignment:", error);
          res.send({ success: false, message: "Something went wrong", error });
        });
    });
    // student mark add by teacher
    app.put("/all-student", async (req, res) => {
      const { classSelecteds, addmark, subjectSelect, name } = req.body;
      console.log("body", req.body);

      // Check if the required fields are present
      if (!classSelecteds || !addmark || !subjectSelect || !name) {
        return res.status(400).send({ message: "Missing required fields" });
      }

      const query = { className: classSelecteds, name: name }; // Matching class and student name
      const newSubjectMark = {
        subject: subjectSelect,
        mark: parseInt(addmark),
      };

      try {
        // Use the MongoDB native driver to perform the update
        const result = await studentCollection.updateOne(query, {
          $push: { subjectMarks: newSubjectMark }, // Add to subjectMarks array
        });

        console.log("result", result);

        // Check if the update was successful
        if (result.modifiedCount > 0 || result.upsertedCount > 0) {
          res.send({ message: "Mark and subject added successfully!" });
        } else {
          res.send({
            message: "No matching student found or no changes made.",
          });
        }
      } catch (error) {
        console.error("Error updating student:", error);
        res.status(500).send({ message: "Something went wrong!" });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello scholl-managment  Server..");
});

app.listen(port, () => {
  console.log(`school is running on port ${port}`);
});
