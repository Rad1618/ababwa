// JavaScript source code
function Draw()
{
    var canvas = document.getElementById("plansza");
    if (canvas.getContext)
    {
        var ctx = canvas.getContext('2d');
        ctx.lineCap = 'round';  //ustawienia początkowe

        ctx.strokeRect(275, 275, 50, 50);   //środek planszy
        ctx.strokeRect(275, 75, 50, 200);
        ctx.strokeRect(75, 275, 200, 50);
        ctx.strokeRect(275, 325, 50, 200);
        ctx.strokeRect(325, 275, 200, 50);

        ctx.fillStyle = 'rgb(0, 180, 225)';
        ctx.fillRect(25, 175, 50, 50);
        ctx.strokeRect(25, 175, 50, 50);    //brzeg Ali
        ctx.strokeRect(75, 175, 50, 50);
        ctx.strokeRect(125, 175, 50, 50);
        ctx.strokeRect(175, 175, 50, 50);
        ctx.strokeRect(175, 125, 50, 50);
        ctx.strokeRect(175, 75, 50, 50);
        ctx.strokeRect(175, 25, 50, 50);
        ctx.strokeRect(225, 25, 50, 50);
        ctx.strokeRect(275, 25, 50, 50);
        ctx.strokeRect(325, 25, 50, 50);

        ctx.fillStyle = 'rgb(0, 220, 0)';
        ctx.fillRect(375, 25, 50, 50);
        ctx.strokeRect(375, 25, 50, 50);    //brzeg Gildia
        ctx.strokeRect(375, 75, 50, 50);
        ctx.strokeRect(375, 125, 50, 50);
        ctx.strokeRect(375, 175, 50, 50);
        ctx.strokeRect(425, 175, 50, 50);
        ctx.strokeRect(475, 175, 50, 50);
        ctx.strokeRect(525, 175, 50, 50);
        ctx.strokeRect(525, 225, 50, 50);
        ctx.strokeRect(525, 275, 50, 50);
        ctx.strokeRect(525, 325, 50, 50);

        ctx.fillStyle = 'rgb(220, 0, 0)';
        ctx.fillRect(525, 375, 50, 50);
        ctx.strokeRect(525, 375, 50, 50);    //brzeg Harb
        ctx.strokeRect(475, 375, 50, 50);
        ctx.strokeRect(425, 375, 50, 50);
        ctx.strokeRect(375, 375, 50, 50);
        ctx.strokeRect(375, 425, 50, 50);
        ctx.strokeRect(375, 475, 50, 50);
        ctx.strokeRect(375, 525, 50, 50);
        ctx.strokeRect(325, 525, 50, 50);
        ctx.strokeRect(275, 525, 50, 50);
        ctx.strokeRect(225, 525, 50, 50);

        ctx.fillStyle = 'rgb(128, 0, 127)';
        ctx.fillRect(175, 525, 50, 50);
        ctx.strokeRect(175, 525, 50, 50);    //brzeg Marva
        ctx.strokeRect(175, 475, 50, 50);
        ctx.strokeRect(175, 425, 50, 50);
        ctx.strokeRect(175, 375, 50, 50);
        ctx.strokeRect(125, 375, 50, 50);
        ctx.strokeRect(75, 375, 50, 50);
        ctx.strokeRect(25, 375, 50, 50);
        ctx.strokeRect(25, 325, 50, 50);
        ctx.strokeRect(25, 275, 50, 50);
        ctx.strokeRect(25, 225, 50, 50);

        ctx.strokeRect(25, 50, 50, 50);     //pola startowe
        ctx.strokeRect(75, 50, 50, 50);
        ctx.strokeRect(25, 100, 50, 50);
        ctx.strokeRect(75, 100, 50, 50);

        ctx.strokeRect(450, 25, 50, 50);
        ctx.strokeRect(450, 75, 50, 50);
        ctx.strokeRect(500, 25, 50, 50);
        ctx.strokeRect(500, 75, 50, 50);

        ctx.strokeRect(475, 450, 50, 50);
        ctx.strokeRect(475, 500, 50, 50);
        ctx.strokeRect(525, 450, 50, 50);
        ctx.strokeRect(525, 500, 50, 50);

        ctx.strokeRect(50, 475, 50, 50);
        ctx.strokeRect(50, 525, 50, 50);
        ctx.strokeRect(100, 475, 50, 50);
        ctx.strokeRect(100, 525, 50, 50);

        Arrow(ctx, 25, 175, 'E', 'rgb(255, 200, 0)');   //rysowanie strzałek
        Arrow(ctx, 375, 25, 'S', 'rgb(255, 200, 0)');
        Arrow(ctx, 525, 375, 'W', 'rgb(255, 200, 0)');
        Arrow(ctx, 175, 525, 'N', 'rgb(255, 200, 0)');
        Arrow(ctx, 275, 25, 'S', 'rgb(0, 220, 0)');
        Arrow(ctx, 525, 275, 'W', 'rgb(220, 0, 0)');
        Arrow(ctx, 275, 525, 'N', 'rgb(128, 0, 127)');
        Arrow(ctx, 25, 275, 'E', 'rgb(0, 180, 225)');
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
        case 'E':
            x = x1 = y1 = 12;
            start_x += 12;
            start_y += 25;
            break;
        case 'W':
            x = x1 = y1 = -12;
            start_x += 38;
            start_y += 25;
            break;
        case 'S':
            y = y1 = x1 = 12;
            start_x += 25;
            start_y += 12;
            break;
        case 'N':
            y = y1 = x1 = -12;
            start_x += 25;
            start_y += 38;
            break;
    }
    ctx.beginPath();    //rysowanie lini strzałki
    ctx.moveTo(start_x, start_y);   //ustawianie początku
    ctx.lineTo(start_x + 2 * x, start_y + 2 * y);
    ctx.moveTo(start_x + 2 * x, start_y + 2 * y);   //potrzebne, aby grot był wygładzony
    ctx.lineTo(start_x + x1, start_y + y1);  //rysowanie grotu strzałki
    ctx.moveTo(start_x + 2 * x, start_y + 2 * y);
    if (obr === 'W' || obr === 'E')
        ctx.lineTo(start_x + x1, start_y - y1);
    else
        ctx.lineTo(start_x - x1, start_y + y1);
    ctx.stroke();
    ctx.strokeStyle = bufor_strokeStyle;    //powrót do wcześniejszych ustawień
    ctx.lineWidth = buffor_lineWidth;
}
