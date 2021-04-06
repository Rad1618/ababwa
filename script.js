const CLIENT_ID = 'vFOvI7h7IFyxdWG6'; //W te '' wpisz swoje ID
if (CLIENT_ID === 'vFOvI7h7IFyxdWG6');
const ROOM_NAME = 'main'

const DOM =
{
    chat: document.getElementById('message_window'),
    message_form: document.getElementById('message_form'),
    message_button: document.getElementById('button_send'),
    leave_fraction: document.getElementById('button1'),
    users_info: document.getElementById('users_info'),
    window_frakcje: document.getElementById('window_frakcje'),
    end_turn: document.getElementById('end_turn'),
    board: document.getElementById("plansza"),
    dice: document.getElementById("kosc"),
};

var data_public =
{
    chat_text: [],
    fractions: [null, null, null, null],
    fractions_id: [null, null, null, null],
    turn: -1,
    game_started: false,
};

const data_private =
{
    host: false,
    import_chat: false,
    fraction: -1,
    dice: 0,
    can_dice: false,
    can_end_turn: false,
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
        Send_message('welcome', null);
    });

    room.on('members', function (m)
    {
        members = m;
        if (members.length === 1)
        {
            data_private.import_chat = true;
            data_private.host = true;   //pierwszy gracz zostaje hostem
            console.log('Miłościwie nam panujący host: ' + members[0].clientData.name);
        }
        Update_members();
    });

    room.on('member_join', function (member)
    {
        if (data_private.host)  //tylko host dodaje sobie osobę do listy
        {
            members.push(member);
            Update_members();
            Send_message('new_members', members);
        }
    });
    
    room.on('member_leave', function(id)
    {
        /*const index = members.findIndex(member => member.id === id);
        members.splice(index, 1);
        Update_members();*/
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
                case 'bot_chat':
                    Add_bot_chat(message.content, true);
                    break;
                case 'bot_info':
                    if (drone.clientId === message.recipient)
                        Add_bot_chat(message.content, false);
                    break;
                case 'welcome':
                    Add_bot_chat('Do pokoju dołączył ' + member.clientData.name);
                    if (data_private.host)
                    {
                        //console.log(data_public.chat_text);
                        Send_message('chat_import', data_public.chat_text);
                        Send_message('update', data_public);
                    }
                    break;
                case 'byby':
                    if (message.content != null)    //gracz żegnający się był hostem
                    {
                        console.log('Umarł host! Niech żyje host!');
                        var host_i = -100, my_i = -100;
                        for (var i = 0; i < members.length; i++)
                        {
                            if (members[i].id === drone.clientId)   //znaleziono siebie
                                my_i = i;
                            if (members[i].id === message.recipient)    //znaleziono hosta
                                host_i = i;
                        }
                        my_i++; //nowym hostem zostaje gracz poprzedni w tablicy (zapętlonej)
                        if (my_i >= members.length)
                            my_i -= members.length;
                        if (my_i === host_i)    //Ty jesteś nowym hostem
                        {
                            console.log("Zostałeś nowym hostem.");
                            data_private.host = true;
                            data_public = message.content;
                        }
                    }
                    Add_bot_chat('Pokój opuścił ' + member.clientData.name);
                    for (var i = 0; i < members.length; i++)    //ucinanie uczestnika z listy
                    {
                        if (members[i].id === member.id)
                        {
                            members.splice(i, 1);
                            Update_members();
                            break;
                        }
                    }
                    break;
                case 'chat_import':  //odświerzanie chatu dla nowych
                    if (!data_private.import_chat)  //nie ma importowanego chatu
                    {
                        //console.log(message.content);
                        DOM.chat.innerText = '';    //czyszczenie chatu
                        for (var i = 0; i < message.content.length; i++)
                            DOM.chat.appendChild(Create_message_element(message.content[i], 'color:black'));
                        data_private.import_chat = true;
                    }
                    break;
                case 'new_members': //aktualizacja listy członków
                    if (!data_private.host)  //niehosty aktualizują listę
                    {   
                        members = message.content;
                        Update_members();
                    }
                    break;
                case 'update':
                    if (!data_private.host)
                        data_public = message.content;
                    Update_windows();
                    Draw_board();
                    break;
                case 'fractions_change':    //na tę wiadomość odpowiada tylko host
                    if (data_private.host)
                    {
                        if (data_public.fractions[message.content] === null)    //puste miejsce frakcji
                        {
                            if (data_public.turn === message.content && data_public.game_started) //nie można dołączyć do frakcji podczas jej tury
                            { 
                                Send_message('bot_info', 'Nie możesz dołączyć do frakcji, kiedy jest jej tura.', member.id);
                            }
                            else {  //gracz może opuścić grę
                                data_public.fractions[message.content] = member.clientData.name;    //przypisanie miejsca graczowi
                                data_public.fractions_id[message.content] = member.id;
                                Send_message('update', data_public);    //wysłanie informacji o decyzji pozostałym
                                Send_message('fraction_approval', message.content, member.id);
                            }
                        }
                    }
                    break;
                case 'fraction_approval':
                    if (drone.clientId === message.recipient)
                    {
                        Add_bot_chat('Dołączyłeś do frakcji: ' + Fraction(message.content), false);
                        data_private.fraction = message.content;
                        Update_windows();
                    }
                    break;
                case 'fraction_leave':
                    if (data_private.host)
                    {
                        data_public.fractions[message.content] = null;  //czyszczenia miejsca w danych
                        data_public.fractions_id[message.content] = null;
                        Send_message('update', data_public);    //wysłanie informacji o decyzji pozostałym
                    }
                    break;
                case 'start_game':
                    if (data_private.host && !data_public.game_started) //host otrzymuje informację o rozpoczęciu gry
                    {
                        data_public.game_started = true;
                        Send_message('bot_chat', 'Rozpoczęto grę.');
                        Send_message('end_turn', data_public);    //wysłanie informacji o rozpoczęciu gry pozostałym i rozpoczęcie gry
                    }
                    break;
                case 'dice_roll':
                    Dice_roll(message.content[0], message.content[1]);
                    break;
                case 'dice_update':
                    Draw_dice(-1, message.content);
                    break;
                case 'end_turn':
                    if (data_private.host)
                    {
                        do
                        {
                            data_public.turn++;
                            if (data_public.turn >= 4)
                                data_public.turn -= 4;
                        } while (data_public.fractions_id[data_public.turn] === null);
                        Send_message('update_turn', data_public);
                    }
                    break;
                case 'update_turn':
                    if (!data_private.host)
                        data_public = message.content;
                    Update_windows();
                    Draw_board();
                    if (data_public.turn === data_private.fraction) //Teraz Twoja tura
                    {
                        Start_turn();
                    }
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
    Message_form_confirm();
});

//Inne reakcje
DOM.message_form.addEventListener('keypress', function ()
{
    if (event.keyCode === 13)
    {
        event.preventDefault();
        Message_form_confirm();
    }
})

function Message_form_confirm()
{
    const value = DOM.message_form.value;
    if (value === '') 
    {
        return;
    }
    Send_message('chat', DOM.message_form.value)
    DOM.message_form.value = '';
}

function Send_message(inputType, inputContent, id = null)
{
    drone.publish(
    {
        room: 'observable-' + ROOM_NAME,
        message:
        {
            type: inputType,
            content: inputContent,
            recipient: id,
        },
    });
}


//------------- HTMLowy stuff

function Update_members()
{
    DOM.users_info.innerText = ``;
    DOM.users_info.appendChild(Create_message_element(`${members.length} użytkowników w pokoju:`, 'color:black'));
    members.forEach(member =>
    {
        var text = member.clientData.name;
        if (member.id === drone.clientId)
            text += ' (Ty)';
        DOM.users_info.appendChild(Create_message_element(text, 'color:black'));
    })
}

function Update_windows()   //odświerzanie ekranu i okien
{   
    DOM.window_frakcje.innerText = '';
    var symbol = ['🎲', '♟️', '🛡️', '🧞']; //odświerzanie okna frakcji
    var count = [2, 2, 1, 3];
    for (var i = 0; i < 4; i++)
    {
        text = Fraction_information(i, symbol[i], count[i]);
        DOM.window_frakcje.appendChild(Create_message_element(text, 'color:' + Fraction_color(i))); 
    }
}

function Fraction_information(fraction, bonus, bonus_count)
{
    var text = '';
    if (fraction === data_public.turn && data_public.game_started)
        text = '➔ ';
    text += Fraction(fraction);
    if (data_public.fractions[fraction] != null)
        text += ' (' + data_public.fractions[fraction] + ')';
    text += ' ';
    for (var i = 0; i < bonus_count; i++)
        text += bonus;
    return text;
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
    var msg = Create_normal_message(member.clientData.name + ': ' + text, true);
    el.appendChild(msg);
    el.scrollTop = el.scrollHeight;
}

function Add_bot_chat(text, public = true)
{
    const el = DOM.chat;
    var msg = Create_normal_message(text, public);
    el.appendChild(msg);
    el.scrollTop = el.scrollHeight;
}

function Create_normal_message(text, public)
{
    var msg = Create_message_element(text, 'color:black');
    if (data_private.host && public)
    {
        //console.log('Przed: ' + data_public.chat_text);
        data_public.chat_text.push(text);
        //console.log('Po: ' + data_public.chat_text);
    }
    return msg;
}

function Before_closing()
{
    if (data_private.host)  //jeśli był hostem przekazuje dane
        Send_message('byby', data_public, drone.clientId);
    else
        Send_message('byby', null);
}
