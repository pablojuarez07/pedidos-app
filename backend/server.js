require('dotenv').config()
const express = require("express");
const cors = require("cors");
const productosRoutes = require("./routes/productos_routes");
const pedidosRoutes =  require("./routes/pedidos_routes");
const uploadRoutes = require("./routes/uploads_routes");
const userRoutes = require("./routes/user_routes");

const http = require('http');
const { Server } = require('socket.io');

// crear la aplicacion express y server para sockets
const app = express();
const server = http.createServer(app);

// traemos el puerto de .env sino es 3000
const PORT = process.env.PORT || 3000;

const io = new Server(server, {
  cors: {
    origin: "https://pedidos-app-alpha.vercel.app/", // permitir llamadas frontend
    methods: ["GET", "POST"]
  }
});

app.use(cors());

// registrar peticiones
app.use((req, res, next) => {
  console.log(`${req.method} request made to: ${req.url}`);
  next(); // pasar a la siguiente ruta
});
// para interpretar como json el req.body
app.use(express.json());

app.use("/user", userRoutes);
app.use("/productos", productosRoutes); // endpoints para productos
app.use("/pedidos", pedidosRoutes);
app.use("/upload", uploadRoutes);       // endpoints para imagenes
app.use('/uploads', express.static('uploads')); // imagenes

// Guardamos io globalmente para usarlo en las rutas
app.set("socketio", io);

// Eventos WebSocket
io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  // recibir mensaje
  socket.on("mensaje", (data) => {
    console.log("Mensaje recibido:", data);

    // reenviar a todos (broadcast)
    io.emit("mensaje", data);
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

// iniciar servidor
server.listen(PORT, () => {
  console.log(`servidor corriendo en http://localhost:${PORT}`);
})