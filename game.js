// JavaScript source code

var tables =
{
    spaces: [],
    images: [],
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
}

function Make_pawns()
{
    for (var i = 0; i < 4 * data_public.ppp; i++)
    {
        var pawn =
        {
            position: tables.spaces[40 + i],
            scale: 0.8,
            position_id: 40 + i,
            fraction: Math.floor(i / data_public.ppp),
            color: Fraction_color(Math.floor(i / data_public.ppp)),
            state: 'home',
        };
        data_public.pawns.push(pawn);
    }
}

DOM.board.addEventListener('mousedown', function (e)
{
    if (data_private.fraction === -1) 
    {
        for (var i = 0; i < 4; i++)
        {
            if (e.offsetX >= tables.spaces[10 * i][0] && e.offsetX <= tables.spaces[10 * i][0] + 50
                && e.offsetY >= tables.spaces[10 * i][1] && e.offsetY <= tables.spaces[10 * i][1] + 50) 
            {
                Send_message('fractions_change', i);    //wysłanie proźby o zmianę frakcji
            }
        }
    }
    if (!data_public.game_started)
    {
        if (e.offsetX >= 275 && e.offsetX <= 325 && e.offsetY >= 275 && e.offsetY <= 375) 
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

    if (data_private.fraction != -1)    //kliknięcia na pionki
    {
        for (var i = 0; i < data_public.ppp; i++)   //sprawdzanie ruchu pionków
        {
            var id = data_public.ppp * data_private.fraction + i;
            if (Math.pow(e.offsetX - data_public.pawns[id].position[0] - 25, 2) + Math.pow(e.offsetY - data_public.pawns[id].position[1] - 25, 2) <= Math.pow(20 * data_public.pawns[id].scale, 2))
            {   //kliknięto na pionek
                if (data_private.can_move_pawn[i])  //można się ruszyć pionkiem
                {
                    data_private.board_draw = null;
                    Pawn_move(i, data_private.dice_score);
                    if (data_private.dice === 0)    //może zakończyć turę
                        data_private.can_end_turn = true;
                    break;  //ruch tylko jednym pionkiem
                }
            }
        }
    }
});

DOM.leave_fraction.addEventListener('click', function ()
{
    if (data_private.fraction != -1)
    {
        if (data_public.turn != data_private.fraction || !data_public.game_started)
        {
            Add_bot_chat('Opuściłeś frakcję: ' + Fraction(data_private.fraction), false);
            Send_message('fraction_leave', data_private.fraction);
            data_private.fraction = -1;
        }
        else  //nie możej opuścić frakcji, jeśli jest Twoja tura
            Add_bot_chat('Nie możesz opuścić frakcji, kiedy jest Twoja tura.', false);
    }
});

DOM.dice.addEventListener('mousedown', function (e)
{
    if (data_private.can_dice)//może rzucić kością
    {    
        if (e.offsetX >= 10 && e.offsetX <= 90 && e.offsetY >= 10 && e.offsetY <= 90)   //rzut kością
        {
            data_private.can_dice = false;  //odjęcie możliwości rzutu
            data_private.dice--;
            rand = Math.floor(Math.random() * 6) + 1;
            if (data_private.to_debugging[0] != 0)
                rand = data_private.to_debugging[0];
            //Dice_roll(rand, data_private.dice);
            data_private.dice_score = rand;
            Send_message('dice_roll', [rand, data_private.dice]);
        }
    }
});

DOM.end_turn.addEventListener('click', function ()
{
    if (data_public.game_started && data_private.fraction === data_public.turn)   //tylko gracz grający daną frakcją może zakończyć turę
    {
        if (data_private.can_end_turn) 
        {
            data_private.board_draw = null;
            data_private.can_end_turn = false;
            Send_message('end_turn', null);
        }
        else
            Add_bot_chat('Nie możesz jeszcze zakończyć tury.', false);
    }
});

function Dice_roll(number, roll)
{
    //tworzenie efektu turlającej się kości
    Draw_dice(Math.floor(Math.random() * 6) + 1, roll);  //losowanie liczby od 1 do 6
    setTimeout(() => { Draw_dice(Math.floor(Math.random() * 6) + 1, roll); }, 50);
    setTimeout(() => { Draw_dice(Math.floor(Math.random() * 6) + 1, roll); }, 150);
    setTimeout(() => { Draw_dice(Math.floor(Math.random() * 6) + 1, roll); }, 300);
    setTimeout(() => { Draw_dice(Math.floor(Math.random() * 6) + 1, roll); }, 500);
    setTimeout(() => { Draw_dice(Math.floor(Math.random() * 6) + 1, roll); }, 750);
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
}

function Pawn_move(id, distance)
{
    id = data_public.ppp * data_private.fraction + id;  //id pionka w całej tablicy
    switch (data_public.pawns[id].state)
    {
        case 'home':    //wyjście pionka z domu
            Send_message('pawn_move', [id, 'play', 10 * data_private.fraction]); //wysłanie wiadomości o ruchu pionka
            break;
        case 'play':
            var new_position_id = (data_public.pawns[id].position_id + distance);
            var end_position = ((data_private.fraction + 3) % 4) * 10 + 8;  //pozycja ostatniego pola
            var normal_move = true;
            for (var i = data_public.pawns[id].position_id; i < new_position_id; i++)   //sprawdzanie wszystkich pól, po których przejdzie pionek
            {
                if (i % 40 === end_position)    //pionek przejdzie przez ostatnie pole
                {
                    normal_move = false;
                    Send_message('pawn_move', [id, 'finish', 56 + ((data_private.fraction + 3) % 4) * 4]);  //ruch na pole zwycięstwa
                    break;
                }
            }
            if (normal_move)
                Send_message('pawn_move', [id, 'play', new_position_id % 40]);
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
        if (data_public.pawns[data_private.fraction * data_public.ppp + i].state === 'play')
        {
            return true;
        }
    }
    return false;
}
