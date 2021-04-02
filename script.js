const CLIENT_ID = 'vFOvI7h7IFyxdWG6'; //W te '' wpisz swoje ID
if (CLIENT_ID === 'vFOvI7h7IFyxdWG6');
const ROOM_NAME = 'main'

const DOM = 
{
  membersCount: document.querySelector('.members-count'),
  fractions_list: document.querySelector('.fractions-list'),
  messages: document.querySelector('.messages'),
  input: document.querySelector('.message-form__input'),
  form: document.querySelector('.message-form'),
  button1: document.querySelector('#button1'),
  button2: document.querySelector('#button2'),
};

const drone = new ScaleDrone(CLIENT_ID, 
{
  data: 
  { // Will be sent out as clientData via events
    //name: prompt("Wpisz swoje imie:"),
    name: 'Test'
  },
});

let members = [];

drone.on('open', error => {
  if (error) {
    return console.error(error);
  }
  console.log('Połączono ze Scaledrone');

  const room = drone.subscribe('observable-' + ROOM_NAME);
  room.on('open', error => 
  {
    if (error) 
    {
      return console.error(error);
    }
    console.log('Successfully joined room');
  });

  room.on('members', m => 
  {
    members = m;
    if (members.length === 1) 
    {
      state.received = true
    }
    updateMembersDOM();
    Update_Fractions();
  });

  room.on('member_join', member => 
  {
    members.push(member);
    Update_Fractions();
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

  room.on('data', (message, member) => 
  {
    if (member) {
      switch (message.type) {
        case 'general':
          addMessageToListDOM(message.content, member);
          break;
      }
    } else {
      // Wiadomośc od serwera, ignorujemy
    }
  });
});

drone.on('close', event => 
{
  console.log('Connection was closed', event);
});

drone.on('error', error => 
{
  console.error(error);
});

//Reackje na przyciski
DOM.form.addEventListener('submit', sendFormMessage);

function sendFormMessage() 
{
  const value = DOM.input.value;
  if (value === '') 
  {
    return;
  }
  sendMessage('general', DOM.input.value)
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
  drone.publish({
    room: 'observable-' + ROOM_NAME,
    message: {
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
  el.className = 'member';
  return el;
}

function updateMembersDOM() 
{
  DOM.membersCount.innerText = ``;
  DOM.membersCount.appendChild(Create_Text(`${members.length} użytkowników w pokoju:`, 'color:black'));
  members.forEach(member =>
    DOM.membersCount.appendChild(createMemberElement(member)));
}

function Update_Fractions() 
{
  DOM.fractions_list.innerText = ``;
  DOM.fractions_list.appendChild(Create_Text('Książę Ali', 'color:Blue'));
  DOM.fractions_list.appendChild(Create_Text('Gildia Kupiecka', 'color:LimeGreen'));
  DOM.fractions_list.appendChild(Create_Text('Państwo Al\'Harb', 'color:Red'));
  DOM.fractions_list.appendChild(Create_Text('Marva Ahmadi', 'color:Purple'));
}

function createMessageElement(text, member) 
{
  const el = document.createElement('div');
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
  const el = DOM.messages;
  const wasTop = el.scrollTop === el.scrollHeight - el.clientHeight;
  el.appendChild(createMessageElement(text, member));
  if (wasTop) {
    el.scrollTop = el.scrollHeight - el.clientHeight;
  }
}

window.onunload = beforeClosing;

function beforeClosing() 
{
  //Tu można zrobić szybkie rzeczy, które staną się przed zamknięciem okna
}
