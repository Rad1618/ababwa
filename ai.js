// JavaScript source code

var scales =
{
    pawn_start: 100,    //do wychodzenia nowychpionków
    pawns_play: 20,
    value_per_distance: 1,  //dla pionków w grze
    dice_waste: -10,
    capture_enemy: 100,
    danger: -120,
    danger_per_distane: -2,
    safe_position: 5,
};

var id_interval = 0;
var waiting = false;

function AI_awake()
{
    id_interval = window.setInterval(() => { if (!waiting) AI_do_something(); }, 100);
    console.log("HAL2k17 is awake");
}

function AI_sleep()
{
    window.clearInterval(id_interval);
    console.log("HAL2k17 goes to sleep");
}

function AI_do_something()
{
    if (data_public.harb_ability && data_private.fraction === 2)    //Habr musi podjąć decyzję
    {
        setTimeout(() => { Board_click(10, 10); waiting = false; }, 150);
    }
    if (data_private.fraction != data_public.turn)  //jeśli to nie jest tura AI, to zasypia
        AI_sleep();
    if (data_private.can_dice)  //może rzucić kością, to rzuca
        Dice_click();
    if (data_private.board_draw != null)    //prawdopodobnie może ruszyć sie pionkiem
    {
        var best_pawn = data_private.fraction * data_public.ppp;
        var best_value = 0;
        var first_choice = false;
        for (var i = 0; i < data_public.ppp; i++)
        {
            if (data_private.can_move_pawn[i])  //może się ruszyć tym pionkiem
            {
                var value = AI_count_value(data_private.fraction * data_public.ppp + i, data_private.dice_score)
                if (value > best_value || !first_choice) //znaleziono lepszą wartość
                {
                    best_pawn = data_private.fraction * data_public.ppp + i;
                    best_value = value;
                    first_choice = true;
                }
            }
        }
        var x = data_public.pawns[best_pawn].position[0] + data_public.pawns[best_pawn].scale * 25;
        var y = data_public.pawns[best_pawn].position[1] + data_public.pawns[best_pawn].scale * 25;
        waiting = true;
        setTimeout(() => { Board_click(x, y); waiting = false; }, 150);    //kliknięcie najlepszego pionka
    }
    if (data_private.can_end_turn && !data_public.harb_ability)  //może zakończyć turę, to kończy
    {
        waiting = true;
        setTimeout(() => { End_turn_click(); waiting = false; }, 250);
    }
}

function AI_count_value(pawn_id, roll)
{
    var zwr = 0;
    var fraction = Math.floor(pawn_id / data_public.ppp);   //frakcja pionka
    if (data_public.pawns[pawn_id].state === 'home' && roll >= 6)
    {
        var pawns_on_board = 0;
        for (var i = fraction * data_public.ppp; i < (fraction + 1) * data_public.ppp; i++)
        {
            if (i === pawn_id)  //nie może liczyć siebie
                continue;
            if (data_public.pawns[i].state === 'play')  //liczenie własnych pionków na planszy
                pawns_on_board++;
        }
        zwr += scales.pawn_start - scales.pawns_play * pawns_on_board;  //uwzględnienie liczby pionków
        zwr += (roll - 6) * scales.dice_waste;  //uwzględnienie utraty oczek kości
        //console.log("Value += " + (scales.pawn_start - scales.pawns_play * pawns_on_board) + ", value == " + zwr);
    }
    else if (data_public.pawns[pawn_id].state === 'play')
    {
        var start_space = data_private.fraction * 10;  //pozycja pierwszego pola ścieżki
        var end_space = ((data_private.fraction + 3) % 4) * 10 + 8;  //pozycja ostatniego pola ścieżki
        var end_position = Pawn_move_to(pawn_id, roll); //pozycja zakończenia ruchu

        var distance = 0;   //dystans od pierwszego pola
        if (data_public.pawns[pawn_id].position_id >= start_space)  //obliczanie odległości od 
            distance = data_public.pawns[pawn_id].position_id - start_space;
        else if (data_public.pawns[pawn_id].position_id <= end_space)
            distance = 38 - (end_space - data_public.pawns[pawn_id].position_id);
        zwr += distance * scales.value_per_distance;

        if (end_position >= 56) //pionek skończy ścieżkę
            zwr += (39 - distance) * scales.dice_waste; //uwzględnienie straty oczek kości

        var enemy_pos = [[],[],[],[]];
        var enemy_id = [[],[],[],[]];
        for (var i = 0; i < data_public.pawns.length; i++)  //uwzględnianie innych pionków
        {
            var enemy_fraction = Math.floor(i / data_public.ppp);
            if (enemy_fraction === data_private.fraction)  //nie uwzględnia własnych pionków
                continue;
            if (data_public.pawns[i].state != 'play')
                continue;
            if (data_public.pawns[i].position_id === end_position && end_position % 10 != 0)    //zbicie wrogiego pionka
                zwr += scales.capture_enemy;

            var add_to_list = true;
            if (data_public.pawns[i].position_id % 10 === 0)    //tylko dla pionków na polach bezpiecznych
            {
                for (var j = 0; j < enemy_pos[enemy_fraction].length; j++)   //sprawdzenie, czy pionek jest na innym polu niż jego pomocnicy
                {
                    if (data_public.pawns[i].position_id === enemy_pos[enemy_fraction][j])  //już taki pionek jest
                    {
                        add_to_list = false;    //nie będzie dodany do listy
                        break;
                    }
                }
            }
            if (add_to_list)
            {
                enemy_id[enemy_fraction].push(i);
                enemy_pos[enemy_fraction].push(data_public.pawns[i].position_id);
            }
        }

        var danger_start = [0, 0, 0, 0];
        var danger_end = [0, 0, 0, 0];
        for (var i = 0; i < enemy_id.length; i++)   //sprawdzanie wszystkich zapisanych pozycji wrogów
        {
            for (var ii = 0; ii < enemy_id[i].length; ii++)
            {
                if (data_public.pawns[pawn_id].position_id % 10 != 0 && Is_in_range(enemy_id[i][ii], data_public.pawns[pawn_id].position_id, 6))    //jest w zasięgu wroga
                    danger_start[i] += 1/6;
                if (end_position % 10 != 0 && Is_in_range(enemy_id[i][ii], end_position, 6))    //będzie w zasięgu wroga
                    danger_end[i] += 1/6;
            }
        }
        var total_danger_start = 1 - (1 - danger_start[0]) * (1 - danger_start[1]) * (1 - danger_start[2]) * (1 - danger_start[3]);
        var total_danger_end = 1 - (1 - danger_end[0]) * (1 - danger_end[1]) * (1 - danger_end[2]) * (1 - danger_end[3]);
        zwr += (total_danger_end - total_danger_start) * (scales.danger + distance * scales.danger_per_distane);   //uwzględnienie zagrożenia ze strony wrogów

        if (data_public.pawns[pawn_id].position_id % 10 === 0)  //uwzględnienie pól zawsze bezpiecznych
            zwr -= scales.safe_position;
        if (end_position % 10 === 0)
            zwr += scales.safe_position;
    }
    console.log("End value [" + pawn_id + "] == " + zwr);
    return zwr;
}
