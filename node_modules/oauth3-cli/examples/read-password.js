/**
 * Get a password from stdin.
 *
 * Adapted from <http://stackoverflow.com/a/10357818/122384>.
 * and <http://stackoverflow.com/q/11600890/>
 *
 * @param prompt {String} Optional prompt. Default 'Password: '.
 * @param callback {Function} `function (cancelled, password)` where
 *      `cancelled` is true if the user aborted (Ctrl+C).
 *
 */
var BKSP = String.fromCharCode(127);

// Probably should use readline
// https://nodejs.org/api/readline.html
function getPassword(prompt, callback) {
    if (prompt) {
      process.stdout.write(prompt);
    }

    var stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    stdin.resume();

    var password = '';
    stdin.on('data', function (ch) {
        ch = ch.toString('utf8');

        switch (ch) {
        case "\n":
        case "\r":
        case "\u0004":
            // They've finished typing their password
            process.stdout.write('\n');
            stdin.setRawMode(false);
            stdin.pause();
            callback(false, password);
            break;
        case "\u0003":
            // Ctrl-C
            callback(true);
            break;
        case BKSP:
            // Backspace
            password = password.slice(0, password.length - 1);
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write(prompt);
            process.stdout.write(password.split('').map(function () {
              return '*';
            }).join(''));
            break;
        default:
            // More passsword characters
            process.stdout.write('*');
            password += ch;
            break;
        }
    });
}

getPassword('Password: ');
