/**
 * This file is part of the DVMFNE Manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

module.exports = function(io) {
    io.on('connection', (socket) => {
        //console.log('user connected');

        socket.on('disconnect', () => {
            //console.log('User disconnected');
        });
    });
};