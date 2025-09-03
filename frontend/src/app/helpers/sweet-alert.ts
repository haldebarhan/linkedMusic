import Swal from 'sweetalert2';

export const SweetAlert = Swal.mixin({
  allowEscapeKey: false,
  allowOutsideClick: false,
});

export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  allowEscapeKey: false,
  timer: 1500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});
