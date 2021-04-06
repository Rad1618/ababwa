// JavaScript source code

DOM.board.addEventListener('mousedown', function (e)
{
    if (data_private.fraction === -1) 
    {
        if (e.offsetX >= 25 && e.offsetX <= 125 && e.offsetY >= 50 && e.offsetY <= 150) 
        {
            Send_message('fractions_change', 0);    //wysłanie proźby o zmianę frakcji
        }

        if (e.offsetX >= 450 && e.offsetX <= 550 && e.offsetY >= 25 && e.offsetY <= 125) 
        {
            Send_message('fractions_change', 1);    //wysłanie proźby o zmianę frakcji
        }

        if (e.offsetX >= 475 && e.offsetX <= 575 && e.offsetY >= 450 && e.offsetY <= 550) 
        {
            Send_message('fractions_change', 2);    //wysłanie proźby o zmianę frakcji
        }

        if (e.offsetX >= 50 && e.offsetX <= 150 && e.offsetY >= 475 && e.offsetY <= 575) 
        {
            Send_message('fractions_change', 3);    //wysłanie proźby o zmianę frakcji
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

DOM.end_turn.addEventListener('click', function ()
{
    if (data_public.game_started && data_private.fraction === data_public.turn) {   //tylko gracz grający daną frakcją może zakończyć turę
        if (data_private.can_end_turn) 
        {
            data_private.can_end_turn = false;
            Send_message('end_turn', null);
        }
        else
            Add_bot_chat('Nie możesz jeszcze zakończyć tury.', false);
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
            //Dice_roll(rand, data_private.dice);
            Send_message('dice_roll', [rand, data_private.dice]);
        }
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
    setTimeout(() => { Draw_dice(number, roll); }, 1050); //ostatni wynik taki, jaki był podany
    if (data_private.dice > 0)  //będzie mógł rzucać ponownie
        setTimeout(() => { data_private.can_dice = true; Draw_dice(-1, roll); }, 1100);
    else if (data_public.turn === data_private.fraction)    //będzie mógł zakończyć turę
        setTimeout(() => { data_private.can_end_turn = true; }, 1100);
}

function Start_turn()
{
    console.log('Start tury');
    data_private.dice = 1;
    data_private.can_dice = true;
    data_private.can_end_turn = false;
    Send_message('dice_update', data_private.dice);
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
