import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  AppBar,
  Toolbar,
  Avatar,
  TextField,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ChatIcon from "@mui/icons-material/Chat";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../pages/confic";
import { Authcontext } from "../context/Authcontext";

const Home = () => {
  const { loginuser } = useContext(Authcontext);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const usersRef = useRef([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    (async () => {
      const userQuery = query(collection(db, "users"));
      const userSnapshot = await getDocs(userQuery);
      userSnapshot.forEach((doc) => {
        usersRef.current = {
          ...usersRef.current,
          [doc.id]: doc.data(),
        };
      });
      const q = query(collection(db, "messages"), orderBy("sentAt", "asc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newMessages = snapshot.docChanges().map((change) => {
          if (change.type === "added") {
            return {
              ...change.doc.data(),
              user: usersRef.current[change.doc.data().sentBy],
              id: change.doc.id,
            };
          }
          return null;
        }).filter(Boolean);
        setMessages((prev) => [...prev, ...newMessages]);
      });
    })();
  }, []);

  const sendMessage = async () => {
    const docRef = await addDoc(collection(db, "messages"), {
      text: message,
      sentBy: loginuser.uid,
      sentAt: serverTimestamp(),
    });
    setMessage(""); 
  };

  const handleMenuClick = (event, message) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedMessage(null);
  };

  const handleDelete = async () => {
    if (selectedMessage) {
      await deleteDoc(doc(db, "messages", selectedMessage.id));
      handleClose();
    }
  };

  const handleUpdate = async (newText) => {
    if (selectedMessage) {
      await updateDoc(doc(db, "messages", selectedMessage.id), {
        text: newText,
      });
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === selectedMessage.id ? { ...msg, text: newText } : msg
        )
      );
      handleClose();
    }
  };

  return (
    <Box
      sx={{
        maxWidth: "600px",
        margin: "auto",
        height: "70vh",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
      }}
    >
      <AppBar position="static" sx={{ borderRadius: "8px 8px 0 0", bgcolor: "green" }}>
        <Toolbar>
          <Avatar sx={{ bgcolor: "white", marginRight: 2 }}>
            <ChatIcon color="primary" />
          </Avatar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Chatbot Assistant
          </Typography>
        </Toolbar>
      </AppBar>
      <Paper
        elevation={3}
        sx={{
          flex: 1,
          padding: 2,
          overflowY: "auto",
          bgcolor: "#f5f5f5",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <List sx={{ padding: 0 }}>
          {messages.map((data) => (
            <ListItem key={data.id} sx={{ justifyContent: data.sentBy !== loginuser.uid ? "flex-start" : "flex-end" }}>
              <Box
                sx={{
                  maxWidth: "75%",
                  display:"flex",
                  bgcolor: data.sentBy !== loginuser.uid ? "#e0e0e0" : "green",
                  color: data.sentBy !== loginuser.uid ? "black" : "white",
                  borderRadius: data.sentBy !== loginuser.uid ? "16px 16px 16px 0" : "16px 16px 0 16px",
                  padding: "10px 15px",
                  boxShadow: 1,
                  wordWrap: "break-word",
                }}
              >
                <Tooltip title={`${data.user?.firstName} ${data.user?.lastname}`}>
                  <Typography variant="body1">{data.text}</Typography>
                </Tooltip>
                {data.sentBy === loginuser.uid && ( 
                  <IconButton
                    size="small"
                    onClick={(event) => handleMenuClick(event, data)}
                    sx={{ marginLeft: 1 }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Box
        sx={{
          display: "flex",
          padding: 2,
          bgcolor: "white",
          borderTop: "1px solid #e0e0e0",
          borderRadius: "0 0 8px 8px",
          boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <TextField
          variant="outlined"
          label="Type your message..."
          fullWidth
          sx={{
            marginRight: 1,
            "& .MuiOutlinedInput-root": {
              borderRadius: "20px",
            },
          }}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <IconButton
          onClick={sendMessage}
          disabled={!message}
          color="primary"
          sx={{
            bgcolor: "green",
            color: "white",
            borderRadius: "50%",
            "&:hover": { bgcolor: "green" },
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem
          onClick={() => {
            const newText = prompt("Edit your message:", selectedMessage.text);
            if (newText) {
              handleUpdate(newText);
            }
          }}
        >
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
    </Box>
  );
};

export default Home;
