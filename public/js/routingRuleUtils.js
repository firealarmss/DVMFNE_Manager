const groups = [];

function addNewTalkGroup() {
    const newTgName = document.getElementById('newTgName').value;
    const newTgActive = document.getElementById('newTgActive').value === 'true';
    const newTgAffiliated = document.getElementById('newTgAffiliated').value === 'true';
    const newTgRoutable = document.getElementById('newTgRoutable').value === 'true';

    const newTalkGroup = {
        name: newTgName,
        config: {
            active: newTgActive,
            affiliated: newTgAffiliated,
            routable: newTgRoutable,
            ignored: []
        },
        source: {
            tgid: parseInt(document.getElementById('newTgSourceTgid').value, 10),
            slot: parseInt(document.getElementById('newTgSourceSlot').value, 10)
        },
        destination: [{
            network: document.getElementById('newTgDestNetwork').value,
            tgid: parseInt(document.getElementById('newTgDestTgid').value, 10),
            slot: parseInt(document.getElementById('newTgDestSlot').value, 10)
        }]
    };

    groups.push(newTalkGroup);

    addTalkGroupToUI(newTalkGroup, groups.length - 1);

    $('#addTalkGroupModal').modal('hide');

    document.getElementById('newTgName').value = '';
}

function addTalkGroupToUI(newTalkGroup, index) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'group mb-3 p-3 border rounded bg-light';
    groupDiv.innerHTML = `
        <div class="form-group">
            <label>Group Name:</label>
            <input type="text" class="form-control group-name" value="${newTalkGroup.name}" data-group-index="${index}" />
        </div>
        <div class="voice-groups">
        </div>
    `;
    document.querySelector('.container').appendChild(groupDiv);
}

function saveChanges() {

    document.querySelectorAll('.group').forEach(groupElem => {
        const index = groupElem.querySelector('.group-name').getAttribute('data-group-index');
        const group = {
            name: groupElem.querySelector('.group-name').value,
            groupHangTime: parseInt(groupElem.querySelector('.group-hang-time').value, 10),
            master: groupElem.querySelector('.group-master').value === 'true',
            sendTgid: groupElem.querySelector('.group-send-tgid').value === 'true',
            groupVoice: []
        };

        groupElem.querySelectorAll('.voice-group').forEach(voiceElem => {
            const vIndex = voiceElem.querySelector('.voice-group-name').getAttribute('data-voice-index');
            const voiceGroup = {
                name: voiceElem.querySelector('.voice-group-name').value,
                config: {
                    active: voiceElem.querySelector('.voice-group-active').value === 'true',
                    affiliated: voiceElem.querySelector('.voice-group-affiliated').value === 'true',
                    routable: voiceElem.querySelector('.voice-group-routable').value === 'true',
                    ignored: Array.from(voiceElem.querySelectorAll('.voice-group-ignored')).map(input => parseInt(input.value, 10))
                },
                destination: Array.from(voiceElem.querySelectorAll('.destination-group')).map(destElem => ({
                    network: destElem.querySelector('.voice-group-destination-network').value,
                    tgid: parseInt(destElem.querySelector('.voice-group-destination-tgid').value, 10),
                    slot: parseInt(destElem.querySelector('.voice-group-destination-slot').value, 10) || 1
                })),
                source: {
                    tgid: parseInt(voiceElem.querySelector('.voice-group-source-tgid').value, 10),
                    slot: parseInt(voiceElem.querySelector('.voice-group-source-slot').value, 10)
                },
            };
            group.groupVoice.push(voiceGroup);
        });

        groups.push(group);
    });

    $.ajax({
        url: '/writeTgRuleChanges',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(groups),
        success: function(response) {
            alert('Changes saved successfully!');
        },
        error: function(xhr, status, error) {
            alert('Error saving changes: ' + error);
        }
    });
}