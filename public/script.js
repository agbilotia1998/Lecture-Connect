$('.class').on("change keyup paste",
  function(){
    if($(this).val()){
      $('.icon-paper-plane').addClass("next");
    } else {
      $('.icon-paper-plane').removeClass("next");
    }
  }
);

$('.next-button').hover(
  function(){
    $(this).css('cursor', 'pointer');
  }
);

$('.next-button.class').click(
  function(){
    $('.class-section').addClass("fold-up");
    $('.duration-section').removeClass("folded");
  }
);

$('.duration').on("change keyup paste",
  function(){
    if($(this).val()){
      $('.icon-lock').addClass("next");
    } else {
      $('.icon-lock').removeClass("next");
    }
  }
);

$('.next-button').hover(
  function(){
    $(this).css('cursor', 'pointer');
  }
);

$('.next-button.duration').click(
  function(){
    $('.duration-section').addClass("fold-up");
    $('.source-lang-section').removeClass("folded");
  }
);

$('.source-lang').on("change keyup paste",
  function(){
    if($(this).val()){
      $('.icon-repeat-lock').addClass("next");
    } else {
      $('.icon-repeat-lock').removeClass("next");
    }
  }
);

$('.next-button.source-lang').click(
  function(){
    $('.source-lang-section').addClass("fold-up");
    $('.success').css("marginTop", 0);
  }
);