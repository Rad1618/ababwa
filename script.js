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
};

const drone = new ScaleDrone(CLIENT_ID, 
{
  data: 
  { // Will be sent out as clientData via events
    name: prompt("Wpisz swoje imie:"),
    //name: 'Test'
  },
});

let members = [];

drone.on('open', function(error) 
{
  if (error) 
  {
    return console.error(error);
  }
  console.log('Połączono ze Scaledrone');

  const room = drone.subscribe('observable-' + ROOM_NAME);
  room.on('open', function(error) 
  {
    if (error) 
    {
      return console.error(error);
    }
    console.log('Successfully joined room');
  });

  room.on('members', function(m) 
  {
    members = m;
    updateMembersDOM();
  });

  room.on('member_join', function(member) 
  {
    members.push(member);
    updateMembersDOM();
  });

  room.on('member_leave',
    ({
      id
    }) => {
      const index = members.findIndex(member => member.id === id);
      members.splice(index, 1);
      updateMembersDOM();
    });

  room.on('data', function(message, member) 
  {
    if (member) 
    {
      switch (message.type) 
      {
        case 'general':
          addMessageToListDOM(message.content, member);
          break;
      }
    } 
    else 
    {
      // Wiadomośc od serwera, ignorujemy
    }
  });
});

drone.on('close', function(event) 
{
  console.log('Connection was closed', event);
});

drone.on('error', function(error) 
{
  console.error(error);
});

//Reackje na przyciski
DOM.message_button.addEventListener('click', sendFormMessage);

function sendFormMessage() 
{
  const value = DOM.message_form.value;
  if (value === '') 
  {
    return;
  }
  sendMessage('general', DOM.message_form.value)
  DOM.input.value = '';
}

DOM.button1.addEventListener('click', button1Reaction);

//Funckja reagująca na kilknięcie przycisku 1
function button1Reaction() 
{
  alert('Cześć!')
}

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
function createMemberElement(member) 
{
  const el = document.createElement('div');
  el.appendChild(document.createTextNode(member.clientData.name));
  el.style = 'color:blue';
  el.className = 'message';
  return el;
}

function updateMembersDOM() 
{
  DOM.users_info.innerText = ``;
  DOM.users_info.appendChild(Create_Text(`${members.length} użytkowników w pokoju:`, 'color:black'));
  members.forEach(member =>
    DOM.users_info.appendChild(createMemberElement(member)));
}

function createMessageElement(text, member) 
{
  const el = document.createElement('message');
  el.appendChild(createMemberElement(member));
  el.appendChild(document.createTextNode(text));
  el.className = 'message';
  return el;
}

function Create_Text(text, color)
{
  const el = document.createElement('div');
  el.appendChild(document.createTextNode(text));
  el.style = color;
  el.className = 'message';
  return el;
}

function addMessageToListDOM(text, member) 
{
  const el = DOM.chat;
  const wasTop = el.scrollTop === el.scrollHeight - el.clientHeight;
  el.appendChild(createMessageElement(text, member));
  if (wasTop) 
  {
    el.scrollTop = el.scrollHeight - el.clientHeight;
  }
}

window.onunload = beforeClosing;

function beforeClosing() 
{
  //Tu można zrobić szybkie rzeczy, które staną się przed zamknięciem okna
}
