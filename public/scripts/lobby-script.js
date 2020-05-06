const re = RegExp('^[a-zA-Z]([a-zA-Z0-9]|[-]|[_])*$')

$(document).ready(function () {

    syncHostCheckbox();
    syncPvtCheckbox();

    $("#valid-input").hide();
    $("#continue-btn").prop("disabled", true);
    $("#handle-text").bind('input', function () { 
        validateHandle() ? $("#valid-input").hide() : $("#valid-input").show();
        updateContinue();
    });

    $("#private-section").hide();

    $("#private-checkbox").change(() => {
        syncPvtCheckbox();
        updateContinue();
    });

    $("#private-host-checkbox").change(() => {
        syncHostCheckbox();
        updateContinue();
    });

    $("#room-text").bind('input', () => {
        updateContinue();
    });
});

function syncPvtCheckbox() {
    let value = $("#private-checkbox").is(":checked");
    if (value)
        $("#private-section").show();
    else
        $("#private-section").hide();
}

function syncHostCheckbox() {
    let value = $("#private-host-checkbox").is(":checked");
    if (value)
        $("#private-non-host-section").hide();
    else
        $("#private-non-host-section").show();
}

function updateContinue() {
    let valid = validateHandle() && validatePrivateRoom();
    $("#continue-btn").prop("disabled", !valid);
}

function validateHandle() {
    let text = $("#handle-text").val();
    return re.test(text) && text.length > 0;
}

function validatePrivateRoom() {
    let private = $("#private-checkbox").is(":checked");
    let host = $("#private-host-checkbox").is(":checked");
    let roomId = $("#room-text").val();

    if(private) {
        if(!host) {
            return roomId.length > 0;
        } else {
            return true;
        }
    } else {
        return true;
    }
}