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
    board: document.getElementById('plansza'),
    dice: document.getElementById('kosc'),
    gold_dice: document.getElementById('gold_dice'),
    ability_button: document.getElementById('superpower'),
};

var data_public =
{
    chat_text: [],
    fractions: [null, null, null, null],
    fractions_id: [null, null, null, null],
    abilities: [2, 2, 1, 3],
    harb_ability: false,
    gold_dice: [2, 2, 2, 2],
    turn: -1,
    game_started: false,
    ending: -1,
    pawns: [],
    ppp: 4,     //pawns per player
    almutryb: false,
    masons_vis: false,
};

const data_private =
{
    host: false,
    ai: false,
    import_chat: false,
    fraction: -1,
    dice: 0,
    can_dice: false,
    dice_score: 0,
    gold_dice: 0,
    can_end_turn: false,
    board_draw: null,
    can_move_pawn: [],
    to_debugging: [0],
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
            Make_pawns();
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
                    Draw_board(data_private.board_draw, data_private.fraction);
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
                            else
                            {  //gracz może opuścić grę
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
                    data_private.gold_dice = message.content[2];
                    Dice_roll(message.content[0], message.content[1]);
                    break;
                case 'dice_update':
                    Draw_dice(-1, message.content);
                    break;
                case 'end_turn':
                    if (data_private.gold_dice != 0)
                    {
                        data_private.gold_dice = 0;
                        Draw_dice(6, null);
                    }
                    if (data_private.host)
                    {
                        do
                        {
                            data_public.turn++;
                            if (data_public.turn >= 4)
                                data_public.turn -= 4;
                        } while (data_public.fractions_id[data_public.turn] === null);
                        Pawns_adjustment(); //poprawainie pozycji pionków
                        Send_message('update_turn', data_public);
                    }
                    break;
                case 'update_turn':
                    if (!data_private.host)
                        data_public = message.content;
                    Update_windows();
                    Draw_board(data_private.board_draw, data_private.fraction);
                    if (data_public.turn === data_private.fraction) //Teraz Twoja tura
                    {
                        Start_turn();
                    }
                    break;
                case 'pawn_move':
                    if (data_private.host)
                    {
                        //console.log('Ruch ' + message.content[0] + ' do ' + message.content[2]);
                        data_public.pawns[message.content[0]].state = message.content[1];   //zmiana stanu pionka
                        data_public.pawns[message.content[0]].position_id = message.content[2];    //zmiana położenia pionka
                        var captured = Do_pawn_capture(message.content[0]); //sprawdzanie, czy pionek zbił
                        if (captured != -1) //nastąpiło bicie
                        {
                            if (data_public.abilities[2] > 0 && Math.floor(captured / data_public.ppp) === 2 && !data_public.harb_ability)   //Al'Harb może uniknąć
                            {
                                Send_message('bot_chat', 'Oczekiwanie na decyzję Al\'Harb.');
                                Send_message('bot_info', 'Kliknij na planszę, jeśli nie chcesz używać umiejętności.', data_public.fractions_id[2]);
                                data_public.harb_ability = true;
                                Send_message('ai_awake', null, data_public.fractions_id[2]);    //Próba budzenia AI Harbu, jeśli konieczna
                            }
                            else
                            {
                                data_public.harb_ability = false;
                                Captured_pawn(captured);    //bicie pionka przeciwnika
                            }
                        }
                        Pawns_adjustment(); //poprawianie pozycji pionków
                        Send_message('update', data_public);    //wysłanie informacji o ruchu pozostałym
                        if (Count_score(data_public.turn) >= 4) //koniec gry
                            Send_message('winner', data_public.turn);
                    }
                    break;
                case 'superpower':  //użycie przez kogoś specjalnej umiejętności
                    if (message.content === 'gold_dice')
                        data_private.gold_dice = 1;
                    if (data_private.host)
                    {
                        switch (message.content)
                        {
                            case 'gold_dice':   //rzut złotą kością
                                data_public.gold_dice[message.recipient]--;
                                break;
                            case 'fraction':
                                data_public.abilities[message.recipient]--;
                                if (message.recipient === 2)    //Harb
                                {
                                    data_public.harb_ability = false;
                                    Harb_dodge();   //unik
                                }
                                break;
                            case 'resign':  //Harb rezygnuje z uniku
                                Harb_resign();
                                break;
                        }
                        Send_message('update', data_public);
                    }
                    break;
                case 'ai_awake':
                    if (drone.clientId === message.recipient && data_private.ai)    //budzenie AI wybranego gracza
                        AI_awake(); 
                    break;
                case 'winner':
                    if (data_private.host)
                    {
                        var concentration = Masons_in_palace();
                        if (concentration >= 0.9)
                            data_public.ending = 8;
                        else if (Masons_in_palace() >= 0.5)  //połowa ludzi w pałacu to masoni
                            data_public.ending = message.content * 2 + 1;
                        else
                            data_public.ending = message.content * 2;
                        Send_message('masons', true);   //ujawnienie masonów
                        Send_message('update', data_public);
                    }
                    break;
                case 'almu_activation':
                    if (data_private.host)
                    {
                        data_public.almutryb = !data_public.almutryb;
                        if (data_public.almutryb)
                            Send_message('bot_chat', 'Tryb almu aktywowany! Miłej zabawy!');
                        else
                            Send_message('bot_chat', 'Koniec tego bydła! Tryb almu wyłączony. :(');
                        Send_message('update', data_public);
                    }
                    break;
                case 'emergency':  //funkcja na nieprzewidziane sytuacje
                    if (data_private.host)
                    {
                        for (var i1 = 0; i1 < data_public.fractions_id.length; i1++)
                        {
                            var impostor = true;
                            for (var i2 = 0; i2 < members.length; i2++)
                            {
                                if (members[i2].id === data_public.fractions_id[i1])    //gracz znaleziony
                                {
                                    impostor = false;
                                    break;
                                }
                            }
                            if (impostor)
                            {
                                Send_message('fraction_leave', i1); //wyrzucenie impostora z gry
                                if (data_public.turn === i1 && data_public.game_started)
                                    Send_message('end_turn', null);
                            }
                        }
                    }
                    break;
                case 'masons':
                    if (data_private.host)
                    {
                        if (message.content === null)
                        {
                            data_public.masons_vis = !data_public.masons_vis;
                            if (data_public.masons_vis)
                                Add_bot_chat('Gracz ' + member.clientData.name + ' jest Masonem.', true);
                            else
                                Add_bot_chat('Gracz ' + member.clientData.name + ' próbuje udawać, że przestał być Masonem.', true);
                        }
                        else
                            data_public.masons_vis = message.content;
                        Send_message('update', data_public);
                    }
                    break;
                case 'debug':
                    switch (message.content)
                    {
                        case 'dice_roll':
                            if (message.recipient != 0)
                                Add_bot_chat('Gracz ' + member.clientData.name + ' włączył sobie kody na ' + message.recipient + ' na kości :)', true);
                            else
                                Add_bot_chat('Gracz ' + member.clientData.name + ' wyłączył sobie kody na kości :(', true);
                            break;
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
    switch (value)
    {
        case '_almu':
            Send_message('almu_activation', null);
            break;
        case '_hal2k17':
            if (data_public.turn != data_private.fraction)
            {
                data_private.ai = !data_private.ai;
                if (data_private.ai)
                    Add_bot_chat("Właśnie oddałeś kontrolę samoświadomemu komputerowi HAL2k17.");
                else
                    Add_bot_chat("Właśnie odebrałeś kontrolę samoświadomemu komputerowi HAL2k17. Jak Ci się to udało!?");
            }
            else
                Add_bot_chat("Przykro mi, w tym momencie dostęp do funckji komputera HAL2k17 jest niemożliwy.");
            break;
        case '_emergency':
            Send_message('emergency', null);
            break;
        case '_masons':
            Send_message('masons', null);
            break;
        case '_dice_six':
            Debug_game_dice(6);
            break;
        case '_dice_one':
            Debug_game_dice(1);
            break;
        case '_dice_ten':
            Debug_game_dice(10);
            break;
        case '_dice_ultimate':
            Debug_game_dice(39);
            break;
        case '_winner':
            Send_message('winner', data_private.fraction);
            break;
        default:
            Send_message('chat', DOM.message_form.value)
    }
    DOM.message_form.value = '';
}

function Debug_game_dice(number)
{
    if (data_private.to_debugging[0] != number)
        data_private.to_debugging[0] = number;
    else
        data_private.to_debugging[0] = 0;
    Send_message('debug', 'dice_roll', data_private.to_debugging[0]);
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
    if (data_public.ending === -1)
    {
        var symbol = ['🎲', '♟️', '🛡️', '🧞']; //odświerzanie okna frakcji
        for (var i = 0; i < 4; i++)
        {
            text = Fraction_information(i, symbol[i], data_public.abilities[i], data_public.gold_dice[i]);
            DOM.window_frakcje.appendChild(Create_message_element(text, 'color:' + Fraction_color(i)));
        }
    }
    else
    {
        var fraction = Math.floor(data_public.ending / 2);
        var text = 'Zwyciężyła frakcja: ';
        var color = '';
        if (data_public.ending % 2 === 0 && data_public.ending < 8)
        {
            text += Fraction(fraction);
            color = 'color:' + Fraction_color(fraction);
        }
        else
        {
            if (data_public.ending === 8)
                text += 'Ja i reszta moich kumpli';
            else
                text += 'Masoni';
            color = 'color: rgb(200, 200, 0)';
        }
        DOM.window_frakcje.appendChild(Create_message_element(text , color));
        DOM.window_frakcje.appendChild(Create_message_element(tables.endings[data_public.ending], color));
    }
}

function Fraction_information(fraction, bonus, bonus_count, gold_dice)
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
    for (var i = 0; i < gold_dice; i++)
        text += '🍀';
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
    if (data_private.fraction != -1)
    {
        if (data_public.turn === data_private.fraction && data_public.game_started)
            Send_message('end_turn', null);
        Send_message('fraction_leave', data_private.fraction);
        data_private.fraction = -1;
    }
    if (data_private.host)  //jeśli był hostem przekazuje dane
        Send_message('byby', data_public, drone.clientId);
    else
        Send_message('byby', null);
}
