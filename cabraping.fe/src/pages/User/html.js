

export function User_html() {
  const jwt = localStorage.getItem('jwt');

  if (!jwt) {
      window.location.href = '/#';
      return;
  }
  return `
  <div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
            <form id="data-info" class="card shadow-sm">

              <img id="avatarImage" src="" class="object-fit-scale card-img-top mh-50" alt="Avatar" style="max-height: 300px;     object-fit: scale-down;">

                <div class="card-body">
                    <div class="mb-3">
                        <label for="username" class="form-label">Username</label>
                        <input type="text" class="form-control" id="username" placeholder="Username" required>
                    </div>
                    <div class="mb-3">
                        <label for="first_name" class="form-label">First Name</label>
                        <input type="text" class="form-control" id="first_name" placeholder="First Name" required>
                    </div>
                    <div class="mb-3">
                        <label for="last_name" class="form-label">Last Name</label>
                        <input type="text" class="form-control" id="last_name" placeholder="Last Name" required>
                    </div>
                    <div class="mb-3">
                        <label for="avatarImageURL" class="form-label">Avatar Image URL</label>
                        <input type="url" class="form-control" id="avatarImageURL" placeholder="Avatar URL">
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Update</button>
                </div>
            </form>
        </div>
    </div>
  </div>
  `;

  // export function User_html() {
//   const jwt = localStorage.getItem('jwt');

//   if (!jwt) {
//       window.location.href = '/#';
//       return;
//   }
//   return `
//   <div class="container py-5">
//     <div class="row justify-content-center">
//         <div class="col-md-8 col-lg-6">
//             <form id="data-info" class="card shadow-sm">

//               <img id="avatarImage" src="" class="object-fit-scale card-img-top mh-50" alt="Avatar" style="max-height: 300px;     object-fit: scale-down;">

//                 <div class="card-body">
//                     <div class="mb-3">
//                         <label for="username" class="form-label">Username</label>
//                         <input type="text" class="form-control" id="username" placeholder="Username" required>
//                     </div>
//                     <div class="mb-3">
//                         <label for="first_name" class="form-label">First Name</label>
//                         <input type="text" class="form-control" id="first_name" placeholder="First Name" required>
//                     </div>
//                     <div class="mb-3">
//                         <label for="last_name" class="form-label">Last Name</label>
//                         <input type="text" class="form-control" id="last_name" placeholder="Last Name" required>
//                     </div>
//                     <div class="mb-3">
//                         <label for="avatarImageURL" class="form-label">Avatar Image URL</label>
//                         <input type="url" class="form-control" id="avatarImageURL" placeholder="Avatar URL">
//                     </div>
//                     <button type="submit" class="btn btn-primary w-100">Update</button>
//                 </div>
//             </form>
//         </div>
//     </div>
//   </div>
//   `;
};
