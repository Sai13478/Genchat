export const registerTypingHandlers = (io, socket) => {
    const userId = socket.user._id.toString();

    socket.on("typing", ({ to, username }) => {
        io.to(to).emit("typing", { from: userId, username, to });
    });

    socket.on("stop-typing", ({ to }) => {
        io.to(to).emit("stop-typing", { from: userId, to });
    });
};
