// JavaScript source code

var tables =
{
    spaces: [],
    images: [],
    endings: [],
};

//0, 10, 20, 30 -> pola bezpieczne

function Make_tables()
{
    //tablica pól
    var center = [275, 275];    //pozycja środka planszy (lewego górnego rogu)
    for (var i1 = 0; i1 < 4; i1++)  //obliczanie koordynatów pól
    {
        for (var i2 = 0; i2 < 10; i2++) //pola brzegowe
        {
            var poz = [(-5 + (Math.min(i2, 3) + Math.max(i2 - 6, 0))) * 50, (-2 - (Math.max(i2 - 3, 0) - Math.max(i2 - 6, 0))) * 50];
            for (var j = 0; j < i1; j++)
                poz = [-poz[1], poz[0]];
            tables.spaces[i1 * 10 + i2] = [center[0] + poz[0], center[1] + poz[1]]; //pola 0 - 39
        }
        for (var i2 = 0; i2 < 4; i2++)  //pola domów
        {
            var poz = [(-5 + (i2 % 2)) * 50, (-4.5 + Math.floor(i2 / 2)) * 50];
            for (var j = 0; j < i1; j++)
                poz = [-poz[1], poz[0]];
            tables.spaces[40 + i1 * 4 + i2] = [center[0] + poz[0], center[1] + poz[1]];  //pola 40 - 55
        }
        for (var i2 = 0; i2 < 4; i2++)  //pola końcowe
        {
            var poz = [0, (-1 - i2) * 50];
            for (var j = 0; j < i1; j++)
                poz = [-poz[1], poz[0]];
            tables.spaces[56 + i1 * 4 + i2] = [center[0] + poz[0], center[1] + poz[1]];  //pola 56 - 71
        }
    }

    //tablica obrazków pionków
    for (var i = 0; i < data_public.ppp * 4; i++)
    {
        var name = 'pictures/';
        switch (Math.floor(i / data_public.ppp))
        {
            case 0: name += 'Ali '; break;
            case 1: name += 'Gildia '; break;
            case 2: name += 'Harb '; break;
            case 3: name += 'Marva '; break;
        }
        name += ((i % data_public.ppp) + 1) + '.png';
        tables.images[i] = new Image();
        tables.images[i].src = name;
    }
    tables.images[data_public.ppp * 4] = new Image();
    tables.images[data_public.ppp * 4].src = 'pictures/Mason.png';

    Make_endings(); //zapisywanie tekstów zakończeń
}

function Make_pawns()
{
    for (var i = 0; i < 4 * data_public.ppp; i++)
    {
        var czy_mason = Math.random();
        if (czy_mason < 0.44)
            czy_mason = true;
        else
            czy_mason = false;
        var pawn =
        {
            position: tables.spaces[40 + i],
            scale: 0.8,
            position_id: 40 + i,
            fraction: Math.floor(i / data_public.ppp),
            color: Fraction_color(Math.floor(i / data_public.ppp)),
            state: 'home',
            mason: czy_mason,
        };
        data_public.pawns.push(pawn);
    }
}

DOM.board.addEventListener('mousedown', function (e)
{
    if (data_private.ai)
        return;
    Board_click(e.offsetX, e.offsetY);
});

function Board_click(poz_x, poz_y)
{
    if (data_private.fraction === -1) 
    {
        for (var i = 0; i < 4; i++)
        {
            if (poz_x >= tables.spaces[10 * i][0] && poz_x <= tables.spaces[10 * i][0] + 50
                && poz_y >= tables.spaces[10 * i][1] && poz_y <= tables.spaces[10 * i][1] + 50) 
            {
                Send_message('fractions_change', i);    //wysłanie proźby o zmianę frakcji
            }
        }
    }
    else
    {
        for (var i = 0; i < data_public.ppp; i++)   //sprawdzanie ruchu pionków
        {
            var id = data_public.ppp * data_private.fraction + i;
            if (Math.pow(poz_x - data_public.pawns[id].position[0] - 25, 2) + Math.pow(poz_y - data_public.pawns[id].position[1] - 25, 2) <= Math.pow(20 * data_public.pawns[id].scale, 2))
            {   //kliknięto na pionek
                if (data_private.can_move_pawn[i])  //można się ruszyć pionkiem
                {
                    data_private.board_draw = null;
                    Pawn_move(i, data_private.dice_score);
                    if (data_private.dice === 0)    //może zakończyć turę
                        data_private.can_end_turn = true;
                    else
                    {
                        data_private.can_dice = true;
                        Draw_dice(-1, data_private.dice);
                    }
                    break;  //ruch tylko jednym pionkiem
                }
            }
        }
    }
    if (!data_public.game_started)
    {
        if (poz_x >= 275 && poz_x <= 325 && poz_y >= 275 && poz_y <= 375) 
        {
            var sa_gracze = false;
            for (var i = 0; i < 4; i++)
            {
                if (data_public.fractions_id[i] != null)
                {
                    sa_gracze = true;
                    break;
                }
            }
            if (sa_gracze)
                Send_message('start_game', 1);    //rozpoczęcie gry
            else //nie można rozpocząć gry, gdy nie ma graczy
                Add_bot_chat('Nie można rozpocząć gry, gdy nie ma ani jednego gracza.', false);
        }
    }

    if (data_public.harb_ability && data_private.fraction === 2)    //Harb rezygnuje z umiejętności
    {
        Send_message('superpower', 'resign', 2);
    }
}

DOM.dice.addEventListener('mousedown', function (e)
{
    if (data_private.ai)
        return;
    if (e.offsetX >= 10 && e.offsetX <= 90 && e.offsetY >= 10 && e.offsetY <= 90)   //rzut kością
    {
        Dice_click();
    }
});

function Dice_click()
{
    if (data_private.can_dice)//może rzucić kością
    {

        var max = 6;
        var min = 1;
        if (data_private.gold_dice === 1)
        {
            max = 10;   //w rzeczywistości 9, ale trzeba wpisać 10
            min = 0;
        }
        data_private.can_dice = false;  //odjęcie możliwości rzutu
        data_private.dice--;
        rand = Math.floor(Math.random() * max) + min;
        if (data_private.to_debugging[0] != 0)
            rand = data_private.to_debugging[0];
        //Dice_roll(rand, data_private.dice);
        data_private.dice_score = rand;
        Send_message('dice_roll', [rand, data_private.dice, data_private.gold_dice]);

    }
}

DOM.leave_fraction.addEventListener('click', function ()
{
    if (data_private.fraction != -1)
    {
        if (data_public.turn != data_private.fraction || !data_public.game_started)
        {
            Add_bot_chat('Opuściłeś frakcję: ' + Fraction(data_private.fraction), false);
            Send_message('fraction_leave', data_private.fraction);
            data_private.fraction = -1;
            data_private.gold_dice = 0; //na wypadek, gdyby ktoś chciał przenieść złotą kość na inną frakcję
        }
        else  //nie możej opuścić frakcji, jeśli jest Twoja tura
            Add_bot_chat('Nie możesz opuścić frakcji, kiedy jest Twoja tura.', false);
    }
});

DOM.end_turn.addEventListener('click', function ()
{
    if (data_private.ai)
        return;
    End_turn_click();
});

function End_turn_click()
{
    if (data_public.game_started && data_private.fraction === data_public.turn && data_public.ending === -1)   //tylko gracz grający daną frakcją może zakończyć turę
    {
        if (data_private.can_end_turn && !data_public.harb_ability) 
        {
            data_private.board_draw = null;
            data_private.can_end_turn = false;
            Send_message('end_turn', null);
        }
        else
            Add_bot_chat('Nie możesz jeszcze zakończyć tury.', false);
    }
}

DOM.gold_dice.addEventListener('click', function ()
{
    if (data_private.ai)
        return;
    Gold_dice_click();
});

function Gold_dice_click()
{
    if (data_public.game_started && data_private.fraction === data_public.turn && data_public.ending === -1) //tylko obecny gracz może to kliknąć
    {
        if (data_public.gold_dice[data_private.fraction] > 0)   //można jeszcze użyć
        {
            if (data_private.dice > 0)  //ma rzut kością
            {
                if (!data_private.gold_dice)    //nie można użyć 2 razy na jeden rzut
                {
                    data_private.gold_dice = 1;
                    Send_message('superpower', 'gold_dice', data_private.fraction);
                }
                else
                    Add_bot_chat('Masz już złotą kość. Po co Ci druga?', false);
            }
            else
                Add_bot_chat('Nie używaj złotej kości, jeśli nie masz rzutu.', false);
        }
        else
            Add_bot_chat('Wykorzystałeś już swoje złote kości.', false);
    }
}

DOM.ability_button.addEventListener('click', function ()
{
    if (data_private.ai)
        return;
    Ability_button_click();
});

function Ability_button_click()
{
    if (data_private.fraction === 2 && data_public.game_started && data_public.ending === -1)
    {
        if (data_public.harb_ability)   //Harb ma własne zasady
            Send_message('superpower', 'fraction', data_private.fraction);
        else
            Add_bot_chat('Nie możesz teraz użyć swojej umiejętności.', false);
    }
    if (data_public.game_started && data_private.fraction === data_public.turn && data_public.ending === -1 && !data_public.harb_ability) //tylko obecny gracz może to kliknąć
    {
        if (data_public.abilities[data_private.fraction] > 0)   //Można jeszcze użyć
        {
            switch (data_private.fraction)
            {
                case 0: //Książę Ali -> dodatkowy rzut kością
                    if (data_private.dice < 3 && data_private.board_draw === null)
                    {
                        data_private.dice++;
                        data_private.can_dice = true;
                        data_private.can_end_turn = false;
                        Send_message('superpower', 'fraction', data_private.fraction);
                        Send_message('dice_update', data_private.dice);
                    }
                    else
                        Add_bot_chat('Nie możesz teraz użyć swojej umiejętności.', false);
                    break;
                case 1: //Gildia Kupiecka -> ruch o 1 pole
                    if (data_private.board_draw === null)
                    {
                        data_private.dice_score = 1;
                        data_private.can_dice = false;
                        Draw_dice(-1, data_private.dice);
                        data_private.board_draw = 'normal_move';
                        data_private.can_end_turn = false;
                        Send_message('superpower', 'fraction', data_private.fraction);
                    }
                    else
                        Add_bot_chat('Nie możesz teraz użyć swojej umiejętności.', false);
                    break;
                case 3: //Marva Ahmadi -> przerzut kości
                    if (data_private.board_draw != null)    //ma wykonać ruch
                    {
                        data_private.board_draw = null;
                        for (var i = 0; i < data_private.can_move_pawn.length; i++)
                            data_private.can_move_pawn[i] = false;
                        data_private.dice++;
                        data_private.can_dice = true;
                        Draw_dice(-1, data_private.dice);
                        Send_message('superpower', 'fraction', data_private.fraction);
                    }
                    else
                        Add_bot_chat('Nie możesz teraz użyć swojej umiejętności.', false);
                    break;
            }
        }
        else
            Add_bot_chat('Wykorzystałeś już swoje specjalne umiejętkości.', false);
    }
}

function Dice_roll(number, roll)
{
    //tworzenie efektu turlającej się kości
    var max = 6;
    var min = 1;
    if (data_private.gold_dice === 1)
    {
        max = 10;   //w rzeczywistości 9, ale trzeba wpisać 10
        min = 0;
        data_private.gold_dice = 2;
    }
    else if (data_private.gold_dice === 2)
        data_private.gold_dice = 0;
    Draw_dice(Math.floor(Math.random() * max) + min, roll);  //losowanie liczby od 1 do 6
    setTimeout(() => { Draw_dice(Math.floor(Math.random() * max) + min, roll); }, 50);
    setTimeout(() => { Draw_dice(Math.floor(Math.random() * max) + min, roll); }, 150);
    setTimeout(() => { Draw_dice(Math.floor(Math.random() * max) + min, roll); }, 300);
    setTimeout(() => { Draw_dice(Math.floor(Math.random() * max) + min, roll); }, 500);
    setTimeout(() => { Draw_dice(Math.floor(Math.random() * max) + min, roll); }, 750);
    setTimeout(() =>
    {
        if (number >= 6)   //po wyrzuceniu 6 (lub więcej), nie ma więcej rzutów
            roll = 0;
        Draw_dice(number, roll);
    }, 1050); //ostatni wynik taki, jaki był podany
    if (data_public.turn === data_private.fraction) //dotyczy tylko gracza, którego jest tura
    {
        if (number >= 6) //po wyrzuceniu 6 (lub więcej), może wyjść pionkiem z domu
        {
            data_private.dice = 0;  //efekt natychmiastowy
            data_private.can_dice = false;
            setTimeout(() =>
            {
                data_private.board_draw = 'roll_six';
                Draw_board(data_private.board_draw, data_private.fraction);
            }, 1100);
        }
        else  //wyrzucono inną liczbę
        {
            setTimeout(() =>
            {
                if (Can_any_pawn_move())
                {
                    data_private.board_draw = 'normal_move';
                    Draw_board(data_private.board_draw, data_private.fraction);
                }
            }, 1100);
        }
        setTimeout(() =>    //procedura opóźniona
        {
            Draw_dice(-1, data_private.dice);
            if (data_private.dice > 0)  //będzie mógł rzucać ponownie
            {
                data_private.can_dice = true;
                Draw_dice(-1, roll);
            }
            else if (data_private.board_draw === null)    //będzie mógł zakończyć turę
                data_private.can_end_turn = true;
        }, 1100);
    }
}

function Start_turn()
{
    if (Are_pawns_in_game())
        data_private.dice = 1;
    else
        data_private.dice = 3;
    data_private.can_dice = true;
    data_private.can_end_turn = false;
    Send_message('dice_update', data_private.dice);
    if (data_private.ai)    //budzenie AI
        AI_awake();
}

function Pawn_move(id, distance, direct_id = false)
{
    if (!direct_id)
        id = data_public.ppp * data_private.fraction + id;  //id pionka w całej tablicy
    switch (data_public.pawns[id].state)
    {
        case 'home':    //wyjście pionka z domu
            Send_message('pawn_move', [id, 'play', 10 * data_private.fraction]); //wysłanie wiadomości o ruchu pionka
            break;
        case 'play':
            var space_id = Pawn_move_to(id, distance);
            if (space_id != -1)
            {
                if (space_id < 40)
                    Send_message('pawn_move', [id, 'play', space_id]);
                else
                {
                    Send_message('pawn_move', [id, 'finish', space_id]);
                    Send_message('add_score', data_private.fraction);
                }
            }
            break;
    }
}

function Pawns_adjustment()
{
    var counter = 0;
    for (var i = 0; i < data_public.pawns.length; i++)
    {
        data_public.pawns[i].position = tables.spaces[data_public.pawns[i].position_id];    //domyślna pozycja
        data_public.pawns[i].scale = 0.85;
        if (data_public.pawns[i].position_id % 10 === 0 && data_public.pawns[i].position_id < 40)   //pionek na polu bezpiecznym
        {
            if (Math.floor(i / data_public.ppp) === data_public.turn)   //tura frakcji pionka
            {
                var shift = [20, 0];    //przesówanie pionków na brzeg pola
                for (var ii = 0; ii < counter; ii++)    //każdy pionek na inny bok
                    shift = [-shift[1], shift[0]];
                data_public.pawns[i].position = [data_public.pawns[i].position[0] + shift[0], data_public.pawns[i].position[1] + shift[1]];
                data_public.pawns[i].scale = 0.75;
                counter++;
            }
            else
            {
                var shift = [25, 25];   //przenoszenie pionków do narożników
                for (var ii = 0; ii < Math.floor(i / data_public.ppp); ii++)
                    shift = [-shift[1], shift[0]];
                data_public.pawns[i].position = [data_public.pawns[i].position[0] + shift[0], data_public.pawns[i].position[1] + shift[1]];
                data_public.pawns[i].scale = 0.50;
            }
        }
    }
}

function Pawn_move_to(id, roll)
{
    if (roll === 0)
        return -1;
    var zwr = -1;
    var fraction = Math.floor(id / data_public.ppp);    //określanie frakcji pionka
    if (data_public.pawns[id].state === 'play')
    {

        var new_position_id = (data_public.pawns[id].position_id + roll);
        var end_position = ((data_private.fraction + 3) % 4) * 10 + 8;  //pozycja ostatniego pola
        var normal_move = true;
        if (roll >= 0)  //nie liczone przy wycofywaniu się
        {
            for (var i = data_public.pawns[id].position_id; i < new_position_id; i++)   //sprawdzanie wszystkich pól, po których przejdzie pionek
            {
                if (i % 40 === end_position)    //pionek przejdzie przez ostatnie pole
                {
                    normal_move = false;
                    zwr = 56 + ((data_private.fraction + 3) % 4) * 4 + Count_score(fraction);
                    break;
                }
            }
        }
        if (normal_move)
        {
            zwr = new_position_id % 40;
            for (var i = 0; i < data_public.ppp; i++)   //sprawdzanie innych swoich pionków
            {
                var id2 = fraction * data_public.ppp + i;
                if (id2 === id)
                    continue;
                if (data_public.pawns[id2].position_id < 40 && data_public.pawns[id2].position_id % 10 != 0 && data_public.pawns[id2].position_id === data_public.pawns[id].position_id + roll) //ruch pionka jest zablokowany
                {
                    zwr = -1;
                }
            }
        }
    }
    else if (data_public.pawns[id].state === 'home')
    {
        if (roll >= 6)
            zwr = 10 * fraction;
    }
    return zwr;
}

function Is_in_range(hunter_id, victim_pos, range)
{
    //var hunter_start = data_public.pawns[hunter_id].position_id;
    for (var i = 0; i <= range; i++) //zasięg od 0 do wskazanego miejsca (łącznie)
    {
        var hunter_end = Pawn_move_to(hunter_id, i)
        if (hunter_end === victim_pos)  //łowca dopadnie swoją ofiarę
            return true;
    }
    return false;
}

function Do_pawn_capture(id)
{
    var fraction = Math.floor(id / data_public.ppp);    //określanie frakcji pionka
    if (data_public.pawns[id].position_id >= 40 || data_public.pawns[id].position_id % 10 === 0)
        return -1;  //pionek nie może być na tym polu
    for (var i = 0; i < data_public.pawns.length; i++)
    {
        if (Math.floor(i / data_public.ppp) === fraction)   //nie może bić pionków swojej frakcji
            continue;
        if (data_public.pawns[i].position_id === data_public.pawns[id].position_id) //stoi na tym samym polu, co pionek wroga
            return i;   //zwrócenie id pionka do bicia
    }
    return -1;
}

function Captured_pawn(id)  //tylko host używa tej funkcji
{
    var fraction = Math.floor(id / data_public.ppp);    //określanie frakcji pionka
    data_public.pawns[id].state = 'home';
    data_public.pawns[id].position_id = 40 + fraction * 4 + id % 4; //pionek wraca na starą pozycję
    //data_public.pawns[id].position = tables.spaces[40 + fraction * 4 + id % 4];
}

function Harb_dodge()
{
    var harb_position = [];
    for (var i = 0; i < data_public.ppp; i++)    //sprawdzanie pozycji pionków al'harb
    {
        if (data_public.pawns[2 * data_public.ppp + i].state === 'play')    //tylko pionki w grze
        {
            if (data_public.pawns[2 * data_public.ppp + i].position_id % 10 === 0)
                harb_position.push(-1); //pola bezpieczne się nie liczą
            else
                harb_position.push(data_public.pawns[2 * data_public.ppp + i].position_id); //dodanie pozycji do listy
        }
        else
            harb_position.push(-1); //trzeba zapisać wszystkie pionki
        //console.log('Position: ' + harb_position[i]);
    }
    for (var i = 0; i < data_public.pawns.length; i++)
    {
        if (Math.floor(i / data_public.ppp) === 2)
            continue;
        if (data_public.pawns[i].state != 'play')
            continue;
        for (var j = 0; j < harb_position.length; j++)
        {
            if (data_public.pawns[i].position_id === harb_position[j])  //znaleziono pionka i pozycję
            {
                //console.log('Position find: ' + harb_position[j]);
                back = 1;
                while (Pawn_move_to(2 * data_public.ppp + j, -back) === -1)  //wycofywanie się pionka
                    back++;
                Pawn_move(2 * data_public.ppp + j, -back, true);
                return;
            }
        }
    }
}

function Harb_resign()
{
    var harb_position = [];
    for (var i = 0; i < data_public.ppp; i++)    //sprawdzanie pozycji pionków al'harb
    {
        if (data_public.pawns[2 * data_public.ppp + i].state === 'play')    //tylko pionki w grze
        {
            if (data_public.pawns[2 * data_public.ppp + i].position_id % 10 === 0)
                harb_position.push(-1); //pola bezpieczne się nie liczą
            else
                harb_position.push(data_public.pawns[2 * data_public.ppp + i].position_id); //dodanie pozycji do listy
        }
        else
            harb_position.push(-1); //trzeba zapisać wszystkie pionki
        //console.log('Position: ' + harb_position[i]);
    }
    for (var i = 0; i < data_public.pawns.length; i++)
    {
        if (Math.floor(i / data_public.ppp) === 2)
            continue;
        if (data_public.pawns[i].state != 'play')
            continue;
        for (var j = 0; j < harb_position.length; j++)
        {
            if (data_public.pawns[i].position_id === harb_position[j])  //znaleziono pionka i pozycję
            {
                //console.log('Position find: ' + harb_position[j]);
                Send_message('pawn_move', [i, 'play', harb_position[j]]);    //powtórzenie bicia
                return;
            }
        }
    }
}

function Masons_in_palace()
{
    var all = 0;
    var masons = 0;
    for (var i = 0; i < data_public.pawns.length; i++)
    {
        if (data_public.pawns[i].state === 'finish')    //pionek na mecie
        {
            all++;
            if (data_public.pawns[i].mason) //pionek masonem
                masons++;
        }
    }
    if (all === 0)  //na wypadek dzielenia przez 0
        all = 1;
    return masons / all;
}

function Fraction(id)
{
    switch (id)
    {
        case 0: return 'Książę Ali';
        case 1: return 'Gildia Kupiecka';
        case 2: return 'Państwo Al\'Harb';
        case 3: return 'Marva Ahmadi';
    }
    return '';
}

function Fraction_color(id)
{
    switch (id) 
    {
        case 0: return 'rgb(0, 180, 225)';
        case 1: return 'rgb(0, 220, 0)';
        case 2: return 'rgb(220, 0, 0)';
        case 3: return 'rgb(128, 0, 127)';
    }
    return 'rgb(0, 0, 0)';
}

function Are_pawns_in_game()
{
    for (var i = 0; i < data_public.ppp; i++)
    {
        if (data_public.pawns[data_private.fraction * data_public.ppp + i].state === 'play')
        {
            return true;
        }
    }
    return false;
}

function Can_any_pawn_move()
{
    for (var i = 0; i < data_public.ppp; i++)
    {
        //if (data_public.pawns[].state === 'play')
        if (Pawn_move_to(data_private.fraction * data_public.ppp + i, data_private.dice_score) != -1)
        {
            return true;
        }
    }
    return false;
}

function Count_score(fraction)
{
    var zwr = 0;
    for (var i = 0; i < data_public.ppp; i++)
    {
        if (data_public.pawns[fraction * data_public.ppp + i].state === 'finish')
        {
            zwr++;
        }
    }
    return zwr;
}
