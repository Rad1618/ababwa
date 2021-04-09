// JavaScript source code
function Draw()
{
    Draw_board(null, null);   //rysowanie planszy
    Draw_dice(6, 0);   //rysowanie kości z sześcioma oczkami
}

function Draw_board(pawns_mode, fraction) 
{
    if (DOM.board.getContext) 
    {
        var ctx = DOM.board.getContext('2d');
        ctx.clearRect(0, 0, 600, 600);
        ctx.fillStyle = 'rgb(0, 0, 0)'
        ctx.lineCap = 'round';  //ustawienia początkowe
        ctx.lineJoin = 'round';

        if (data_public.game_started)   //rysowanie środka planszy (wskaźnik frakcji na turze)
        {
            ctx.fillStyle = Fraction_color(data_public.turn);
            ctx.fillRect(280, 280, 40, 40);
            ctx.fillStyle = 'rgb(0, 0, 0)'
        }
        else 
        {
            ctx.font = '15px arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('START', 300, 300, 100);
        }

        for (var i = 0; i < 4; i++) //pola bezpieczne (kolorowe wnętrze)
        {
            ctx.fillStyle = Fraction_color(i);
            ctx.fillRect(tables.spaces[i * 10][0], tables.spaces[i * 10][1], 50, 50);
            Arrow(ctx, tables.spaces[i * 10][0], tables.spaces[i * 10][1], (i + 1) % 4, 'rgb(255, 200, 0)');       //rysowanie strzałki początkowej
            Arrow(ctx, tables.spaces[i * 10 + 8][0], tables.spaces[i * 10 + 8][1], (i + 2) % 4, Fraction_color((i + 1) % 4));    //rysowanie strzałki końcowej
        }

        for (var i = 0; i < 72; i++)    //rysowanie obramówek pól
            ctx.strokeRect(tables.spaces[i][0], tables.spaces[i][1], 50, 50);

        Draw_pawns(ctx, pawns_mode, fraction);    //rysowanie pionków
    }
}

function Draw_dice(number, rolls) 
{
    if (DOM.dice.getContext) 
    {
        var ctx = DOM.dice.getContext('2d');
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        if (number != -1) 
        {
            ctx.clearRect(0, 0, 100, 130);  //czyszczenie rysunku
            ctx.lineWidth = 3;
            ctx.strokeRect(10, 10, 80, 80); //rysowanie obramowania

            if (number === 1 || number === 3 || number === 5)   //środkowe oczko
                Dot(ctx, 50, 50, 8);
            if (number === 3 || number === 4 || number === 5 || number === 6)   //reszta oczek
            {
                Dot(ctx, 25, 25, 8);
                Dot(ctx, 75, 75, 8);
            }
            if (number === 2 || number === 4 || number === 5 || number === 6) 
            {
                Dot(ctx, 75, 25, 8);
                Dot(ctx, 25, 75, 8);
            }
            if (number === 6) 
            {
                Dot(ctx, 25, 50, 8);
                Dot(ctx, 75, 50, 8);
            }
        }
        else
            ctx.clearRect(0, 100, 100, 30);

        ctx.lineWidth = 1;
        if (data_private.can_dice)  //różny kolor w zależności, czy można rzucić
        {
            ctx.fillStyle = 'rgb(0, 255, 0)';
            ctx.strokeStyle = 'rgb(0, 255, 0)';
        }
        else
        {
            ctx.fillStyle = 'rgb(255, 0, 0)';
            ctx.strokeStyle = 'rgb(255, 0, 0)';
        }
        for (i = 0; i < 3; i++) 
        {
            if (i >= rolls)
                ctx.fillRect(10 + 30 * i, 100, 20, 20);
            else
                ctx.strokeRect(10 + 30 * i, 100, 20, 20);
        }
    }
}

function Draw_pawns(ctx, mode, fraction)
{
    for (var i = 0; i < data_public.pawns.length; i++)
    {
        if (i % data_public.ppp === 0)
            ctx.fillStyle = Fraction_color(i / data_public.ppp);
        Circle(ctx, data_public.pawns[i].position[0] + 25, data_public.pawns[i].position[1] + 25, 15);
        if (i < data_public.ppp)
            data_private.can_move_pawn[i] = false;  //blokowanie możliwości ruchu
    }
    ctx.fillStyle = 'rgb(0, 0, 0)';
    if (mode === 'roll_six' || mode === 'normal_move')  //możliwość ruchu pionkami po rzucie
    {
        ctx.fillStyle = 'rgba(255, 242, 0, 0.75)';
        for (var i = 0; i < data_public.ppp; i++)
        {
            if (data_public.pawns[fraction * data_public.ppp + i].state === 'play')
            {
                Dot(ctx, data_public.pawns[fraction * data_public.ppp + i].position[0] + 25, data_public.pawns[fraction * data_public.ppp + i].position[1] + 25, 18);
                data_private.can_move_pawn[i] = true;   //może ruszyć się tym pionkiem
            }
        }
        ctx.fillStyle = 'rgb(0, 0, 0)';
    }
    if (mode === 'roll_six' && fraction != -1)    //rysowanie po wyrzuceniu 6
    {
        ctx.fillStyle = 'rgba(255, 242, 0, 0.75)';
        for (var i = 0; i < data_public.ppp; i++)
        {
            if (data_public.pawns[fraction * data_public.ppp + i].state === 'home')
            {
                Dot(ctx, data_public.pawns[fraction * data_public.ppp + i].position[0] + 25, data_public.pawns[fraction * data_public.ppp + i].position[1] + 25, 18);
                data_private.can_move_pawn[i] = true;   //może ruszyć się tym pionkiem
            }
        }
        ctx.fillStyle = 'rgb(0, 0, 0)';
    }
}

function Arrow(ctx, start_x, start_y, obr, color)
{
    var bufor_strokeStyle = ctx.strokeStyle;
    var buffor_lineWidth = ctx.lineWidth;
    var x = 0, y = 0, x1 = 0, y1 = 0;
    ctx.strokeStyle = color;  //odpowiedni kolor i grubość strzałki
    ctx.lineWidth = 5;
    switch (obr)        //ustawianie parametrów, dla różnych obrotów
    {
        case 1: //E
            x = x1 = y1 = 12;
            start_x += 12;
            start_y += 25;
            break;
        case 3: //W
            x = x1 = y1 = -12;
            start_x += 38;
            start_y += 25;
            break;
        case 2: //S
            y = y1 = x1 = 12;
            start_x += 25;
            start_y += 12;
            break;
        case 0: //N
            y = y1 = x1 = -12;
            start_x += 25;
            start_y += 38;
            break;
    }
    ctx.beginPath();    //rysowanie lini strzałki
    ctx.moveTo(start_x, start_y);   //ustawianie początku
    ctx.lineTo(start_x + 2 * x, start_y + 2 * y);
    //ctx.moveTo(start_x + 2 * x, start_y + 2 * y);   //potrzebne, aby grot był wygładzony
    ctx.lineTo(start_x + x1, start_y + y1);  //rysowanie grotu strzałki
    ctx.moveTo(start_x + 2 * x, start_y + 2 * y);
    if (obr === 1 || obr === 3)
        ctx.lineTo(start_x + x1, start_y - y1);
    else
        ctx.lineTo(start_x - x1, start_y + y1);
    ctx.stroke();
    ctx.strokeStyle = bufor_strokeStyle;    //powrót do wcześniejszych ustawień
    ctx.lineWidth = buffor_lineWidth;
}

function Dot(ctx, poz_x, poz_y, radius)
{
    ctx.beginPath();
    ctx.arc(poz_x, poz_y, radius, 0, 2 * Math.PI, true);
    ctx.fill();
}

function Circle(ctx, poz_x, poz_y, radius)
{
    ctx.beginPath();
    ctx.arc(poz_x, poz_y, radius, 0, 2 * Math.PI, true);
    ctx.fill();
    ctx.stroke();
}
