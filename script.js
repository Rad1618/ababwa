const CLIENT_ID = 'vFOvI7h7IFyxdWG6'; //W te '' wpisz swoje ID
if (CLIENT_ID === 'vFOvI7h7IFyxdWG6');
const ROOM_NAME = 'main'

const DOM =
{
    chat: document.getElementById('message_window'),
    message_form: document.getElementById('message_form'),
    message_button: document.getElementById('button_send'),
    button1: document.getElementById('button1'),
    users_info: document.getElementById('users_info'),
    window_frakcje: document.getElementById('window_frakcje'),
};

const drone = new ScaleDrone(CLIENT_ID,
    {
        data:
        { // Will be sent out as clientData via events
            name: prompt("Wpisz swoje imie:"),
            //name: 'Test'
        },
    });

var members = [];

drone.on('open', function (error)
{
    if (error)
    {
        return console.error(error);
    }
    console.log('Połączono ze Scaledrone');

    const room = drone.subscribe('observable-' + ROOM_NAME);
    room.on('open', function (error)
    {
        if (error)
        {
            return console.error(error);
        }
        console.log('Successfully joined room');
        Update_windows();
    });

    room.on('members', function (m)
    {
        members = m;
        Update_members();
    });

    room.on('member_join', function (member)
    {
        members.push(member);
        Update_members();
    });

    room.on('member_leave',
        ({
            id
        }) => {
            const index = members.findIndex(member => member.id === id);
            members.splice(index, 1);
            Update_members();
        });

    room.on('data', function (message, member)
    {
        if (member)
        {
            switch (message.type)
            {
                case 'chat':
                    Add_message_to_chat(message.content, member);
                    break;
            }
        }
        else
        {
            // Wiadomośc od serwera, ignorujemy
        }
    });
});

drone.on('close', function (event)
{
    console.log('Connection was closed', event);
});

drone.on('error', function (error)
{
    console.error(error);
});

//Reackje na przyciski
DOM.message_button.addEventListener('click', function ()
{
    const value = DOM.message_form.value;
    if (value === '') {
        return;
    }
    sendMessage('chat', DOM.message_form.value)
    DOM.message_form.value = '';
});

DOM.button1.addEventListener('click', function ()
{
    sendMessage('chat', 'Kliknąłem przycisk \"Kliknij mnie!\", ale super!');
});

function sendMessage(inputType, inputContent)
{
    drone.publish(
    {
        room: 'observable-' + ROOM_NAME,
        message:
        {
            type: inputType,
            content: inputContent,
        },
    });
}


//------------- HTMLowy stuff

function Update_members()
{
    DOM.users_info.innerText = ``;
    DOM.users_info.appendChild(Create_message_element(`${members.length} użytkowników w pokoju:`, 'color:black'));
    members.forEach(member =>
        DOM.users_info.appendChild(Create_message_element(member.clientData.name, 'color:black')));
}

function Update_windows()
{
    DOM.window_frakcje.appendChild(Create_message_element('Książę Ali 🎲🎲', 'color:rgb(0, 180, 225)'));
    DOM.window_frakcje.appendChild(Create_message_element('Gildia Kupiecka ♟️♟️', 'color:rgb(0, 220, 0)'));
    DOM.window_frakcje.appendChild(Create_message_element('Państwo Al\'Harb 🛡️', 'color:rgb(220, 0, 0)'));
    DOM.window_frakcje.appendChild(Create_message_element('Marva Ahmadi 🧞🧞🧞', 'color:rgb(128, 0, 127)'));
}

function Create_message_element(text, color)
{
    const el = document.createElement('div');
    el.appendChild(document.createTextNode(text));
    el.style = color;
    el.className = 'text_element';
    return el;
}

function Add_message_to_chat(text, member)
{
    const el = DOM.chat;
    el.appendChild(Create_message_element(member.clientData.name + ': ' + text, 'color:black'));
    el.scrollTop = el.scrollHeight;
}

window.onunload = beforeClosing;

function beforeClosing()
{
    //Tu można zrobić szybkie rzeczy, które staną się przed zamknięciem okna
}
