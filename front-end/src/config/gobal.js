import $ from "jquery";

// Khởi chạy tất cả hiệu ứng khi ứng dụng được load
const initGlobalScripts = () => {
  $(document).ready(() => {
    // Chỉ kích hoạt tooltip nếu Bootstrap đã được tải
    if ($.fn.tooltip) {
      $('[data-bs-toggle="tooltip"]').tooltip();
    }

    if ($.fn.popover) {
      $('[data-bs-toggle="popover"]').popover();
    }

    // Sidebar Toggle
    $(".sidebar-toggler").on("click", function () {
      $(".sidebar, .content").toggleClass("open");
    });

    // Dropdown Menu
    $(".nav-link.dropdown-toggle").on("click", function (e) {
      e.preventDefault();
      $(this).next(".dropdown-menu").slideToggle();
    });

    //  Back To Top
    $(window).scroll(() => {
      if ($(window).scrollTop() > 300) {
        $(".back-to-top").fadeIn("slow");
      } else {
        $(".back-to-top").fadeOut("slow");
      }
    });

    $(".back-to-top").on("click", function () {
      $("html, body").animate({ scrollTop: 0 }, 1500);
    });
  });
};

export default initGlobalScripts;
