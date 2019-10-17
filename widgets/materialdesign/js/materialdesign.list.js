/*
    ioBroker.vis vis-materialdesign Widget-Set

    version: "0.0.1"

    Copyright 2019 Scrounger scrounger@gmx.net
*/
"use strict";

// this code can be placed directly in materialdesign.html
vis.binds.materialdesign.list = {
    initialize: function (data) {
        try {
            let itemHeight = getValueFromData(data.listItemHeight, '', 'height: ', 'px !important;');

            let headerFontSize = getFontSize(data.listItemHeaderTextSize);
            let labelFontSize = getFontSize(data.listItemTextSize);
            let subLabelFontSize = getFontSize(data.listItemSubTextSize);

            let imageHeight = getValueFromData(data.listImageHeight, '', 'height: ', 'px !important;');
            let spaceBetweenImageAndLabel = getValueFromData(data.distanceBetweenTextAndImage, '', 'margin-right: ', 'px;');

            let colorCheckBox = getValueFromData(data.colorCheckBox, '', 'style=" --mdc-theme-secondary: ', ';"');

            let nonInteractive = '';
            let itemRole = '';
            if (data.listType === 'text') {
                nonInteractive = ' mdc-list--non-interactive';
            } else if (data.listType === 'checkbox' || data.listType === 'switch') {
                itemRole = 'role="checkbox"';
            }

            let itemList = [];

            let listLayout = '';
            if (data.listLayout === 'card') {
                listLayout = 'materialdesign-list-card';
            } else if (data.listLayout === 'cardOutlined') {
                listLayout = 'materialdesign-list-card materialdesign-list-card--outlined';
            }

            for (var i = 0; i <= data.count; i++) {
                let itemHeaderText = getValueFromData(data.attr('groupHeader' + i), null);
                let itemLabelText = getValueFromData(data.attr('label' + i), `Item ${i}`);
                let itemSubLabelText = getValueFromData(data.attr('subLabel' + i), '');
                let itemImage = getValueFromData(data.attr('listImage' + i), '');

                // generate Header
                itemList.push(getListItemHeader(itemHeaderText, headerFontSize));

                // generate Item -> mdc-list-item
                let listItem = getListItem('standard', i, '', false, false, itemHeight, `data-oid="${data.attr('oid' + i)}"`, itemRole)
                    .replace(' mdc-list-item--activated', '');   // selected object not needed in list

                // generate Item Label
                let itemLabel = '';
                if (itemSubLabelText === '') {
                    itemLabel = getListItemLabel('standard', i, itemLabelText, false, labelFontSize, '', '', '');
                } else {
                    itemLabel = getListItemTextElement(itemLabelText, itemSubLabelText, labelFontSize, subLabelFontSize);
                }

                // generate Item Image for Layout Standard
                let listItemImage = getListItemImage(itemImage, `${imageHeight}${spaceBetweenImageAndLabel}`);

                // generate Item Control Element
                let itemControl = '';
                if (data.listType === 'checkbox') {
                    itemControl = `<div class="mdc-checkbox mdc-list-item__meta" ${colorCheckBox}>
                                        <input type="checkbox" class="mdc-checkbox__native-control" tabindex="-1" data-oid="${data.attr('oid' + i)}" itemindex="${i}">
                                        <div class="mdc-checkbox__background">
                                            <svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24">
                                                <path class="mdc-checkbox__checkmark-path" fill="none" stroke="white" d="M1.73,12.91 8.1,19.28 22.79,4.59"></path>
                                            </svg>
                                        </div>
                                    </div>`;
                } else if (data.listType === 'switch') {
                    itemControl = `<div class="mdc-switch mdc-list-item__meta" ${colorCheckBox}>
                                        <div class="mdc-switch__track"></div>
                                        <div class="mdc-switch__thumb-underlay">
                                            <div class="mdc-switch__thumb">
                                                <input type="checkbox" id="basic-switch" class="mdc-switch__native-control" role="switch" data-oid="${data.attr('oid' + i)}" itemindex="${i}">
                                            </div>
                                        </div>
                                    </div>`
                }

                // generate Item
                itemList.push(`${listItem}${listItemImage}${itemLabel}${itemControl}</div>`);

                // generate Divider
                itemList.push(getListItemDivider(data.attr('dividers' + i), data.listItemDividerStyle));
            }

            return { itemList: itemList.join(''), listLayout: listLayout, nonInteractive: nonInteractive }
        } catch (ex) {
            console.exception(`initialize: error:: ${ex.message}, stack: ${ex.stack}`);
        }
    },
    handler: function (el, data) {
        try {
            let $this = $(el);

            let list = $this.context;

            const mdcList = new mdc.list.MDCList(list);
            const mdcListAdapter = mdcList.getDefaultFoundation().adapter_;
            const listItemRipples = mdcList.listElements.map((listItemEl) => new mdc.ripple.MDCRipple(listItemEl));

            list.style.setProperty("--materialdesign-color-list-item-background", getValueFromData(data.listItemBackground, ''));
            list.style.setProperty("--materialdesign-color-list-item-hover", getValueFromData(data.colorListItemHover, ''));
            list.style.setProperty("--materialdesign-color-list-item-selected", getValueFromData(data.colorListItemSelected, ''));
            list.style.setProperty("--materialdesign-color-list-item-text", getValueFromData(data.colorListItemText, ''));
            list.style.setProperty("--materialdesign-color-list-item-text-activated", getValueFromData(data.colorListItemText, ''));
            list.style.setProperty("--materialdesign-color-list-item-header", getValueFromData(data.colorListItemHeaders, ''));
            list.style.setProperty("--materialdesign-color-list-item-divider", getValueFromData(data.colorListItemDivider, ''));

            mdcList.listen('MDCList:action', function (item) {
                let index = item.detail.index;

                if (data.listType !== 'text') {
                    window.navigator.vibrate(data.vibrateOnMobilDevices);
                }

                if (data.listType === 'checkbox' || data.listType === 'switch') {
                    let selectedValue = mdcListAdapter.isCheckboxCheckedAtIndex(index);

                    vis.setValue(data.attr('oid' + index), selectedValue);

                    setLayout(index, selectedValue);

                } else if (data.listType === 'buttonToggle') {
                    let selectedValue = vis.states.attr(data.attr('oid' + index) + '.val');

                    vis.setValue(data.attr('oid' + index), !selectedValue);

                    setLayout(index, !selectedValue);

                } else if (data.listType === 'buttonState') {
                    let valueToSet = data.attr('listTypeButtonStateValue' + index);

                    vis.setValue(data.attr('oid' + index), valueToSet);

                } else if (data.listType === 'buttonNav') {
                    vis.changeView(data.attr('listTypeButtonNav' + index));

                } else if (data.listType === 'buttonLink') {
                    window.open(data.attr('listTypeButtonLink' + index));
                }
            });

            let itemCount = (data.listType === 'switch') ? $this.find('.mdc-switch').length : mdcList.listElements.length;

            for (var i = 0; i <= itemCount - 1; i++) {
                if (data.listType === 'checkbox' || data.listType === 'switch') {
                    if (data.listType === 'switch') new mdc.switchControl.MDCSwitch($this.find('.mdc-switch').get(i));

                    let valOnLoading = vis.states.attr(data.attr('oid' + i) + '.val');
                    mdcListAdapter.setCheckedCheckboxOrRadioAtIndex(i, valOnLoading);
                    setLayout(i, valOnLoading);

                    vis.states.bind(data.attr('oid' + i) + '.val', function (e, newVal, oldVal) {
                        // i wird nicht gespeichert -> umweg über oid gehen
                        let input = $this.find('input[data-oid="' + e.type.replace('.val', '') + '"]');

                        input.each(function (d) {
                            // kann mit mehreren oid verknüpft sein
                            let index = input.eq(d).attr('itemindex');
                            mdcListAdapter.setCheckedCheckboxOrRadioAtIndex(index, newVal);
                            setLayout(index, newVal);
                        });
                    });

                } else if (data.listType === 'buttonToggle') {
                    let valOnLoading = vis.states.attr(data.attr('oid' + i) + '.val');
                    setLayout(i, valOnLoading);

                    vis.states.bind(data.attr('oid' + i) + '.val', function (e, newVal, oldVal) {
                        // i wird nicht gespeichert -> umweg über oid gehen
                        let input = $this.parent().find('div[data-oid="' + e.type.replace('.val', '') + '"]');

                        input.each(function (d) {
                            // kann mit mehreren oid verknüpft sein
                            let index = parseInt(input.eq(d).attr('id').replace('listItem_', ''));
                            setLayout(index, newVal);
                        });
                    });
                }
            }

            function setLayout(index, val) {
                let curListItem = $this.find(`div[id="listItem_${index}"]`);
                let curListItemImage = curListItem.find(`.mdc-list-item__graphic`);

                if (val === true) {
                    curListItem.css('background', getValueFromData(data.listItemBackgroundActive, ''));
                    curListItemImage.attr('src', getValueFromData(data.attr('listImageActive' + index), getValueFromData(data.attr('listImage' + index), '')))
                } else {
                    curListItem.css('background', getValueFromData(data.listItemBackground, ''));
                    curListItemImage.attr('src', getValueFromData(data.attr('listImage' + index), ''))
                }
            }

        } catch (ex) {
            console.exception(`handler: error: ${ex.message}, stack: ${ex.stack}`);
        }
    }
};