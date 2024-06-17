export  function Chat_html() {

  const jwt = localStorage.getItem('jwt');
  if (!jwt) {
      window.location.href = '/#';
      return;
  }

  return `
  <div class="container-fluid h-100 d-flex flex-column flex-md-row">
    <!-- Panel Izquierdo: Chat List -->
    <div class="bg-light p-3 d-md-block vh-100" style="flex: 0 0 25%;">
      <h3>Chat</h3>
      <div class="mb-4">
        <h4 class="d-flex justify-content-between fs-5">
          Messages with all
          <button id="addChannel" class="btn btn-primary btn-sm">New conversation</button>
        </h4>
        <div id="chanelsLists" class="chat-messages">
            <!-- Aquí se agregarán los mensajes -->
        </div>
      </div>
      <div class="mt-4">
        <h3>Block users</h3>
        <div id="list-block" class="">
        </div>
      </div>
    </div>

    <!-- Panel Medio: Chat Messages -->
    <div class="bg-white p-3 overflow-auto" style="flex-grow: 1;">
      <h3 id="channel-title" class="mb-4">
        Select a user!!!
      </h3>
      <button id="blockUserButton" class="btn btn-danger btn-sm ml-2">Block User</button>
      <button id="usersRouteButton" class="btn btn-secondary btn-sm ml-2">User info</button>
      <button id="inviteGameButton" class="btn btn-secondary btn-sm ml-2">Invite to a game</button>
      <button id="acceptGameButton" class="btn btn-secondary btn-sm ml-2">Accept to join the game</button>
      <button id="cancelGameButton" class="btn btn-warning btn-sm ml-2">Cancel Invitation</button>
      <!-- Messages go here -->
      <ul id="messageList" class="list-unstyled overflow-auto v-75 " style="max-height: 48vh; min-height: 200px; ">
        <!-- Aquí se agregarán los mensajes -->
      </ul>
      <!-- Textarea for new messages -->
      <div class="mt-3">
        <textarea id="messageTextarea" class="form-control" rows="3"></textarea>
        <button id="sendButton" class="btn btn-primary mt-2">Send</button>
      </div>
    </div>

  </div>

    <!-- Modal para crear un nuevo canal -->
    <div class="pe-auto position-fixed w-100 h-100 overflow-auto d-none top-0 start-0" style="" tabindex="-1" role="dialog" id="channelModal">
      <div class="pe-auto modal-dialog" role="document">

        <div class="pe-auto bg-white mx-auto p-4 border">

          <div class="modal-header">
            <h5 class="modal-title">New conversation</h5>
            <h5 class="modal-title">Who do you want to start a conversation with?</h5>
            <button id="closeModalButton" type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">

            <p>Members</p>
            <select multiple class="form-control" id="channelMembers"></select>

          </div>
          <div class="modal-footer">
            <button type="button" id="saveChannelButton" class="btn btn-primary">Save Channel</button>
          </div>
        </div>
      </div>
    </div>
    `;
}