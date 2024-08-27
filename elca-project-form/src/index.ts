import './style.scss';
import $ from 'jquery';

$(function () {
    $("#project-list-link").on('click', () => {
        let pageInput:Xrm.Navigation.PageInputHtmlWebResource = {
            pageType: "webresource",
            webresourceName: "elca_projectmanagementpage"
        };

        var navigationOptions :Xrm.Navigation.NavigationOptions= {
            target: 1,
        };

        parent.Xrm.Navigation.navigateTo(pageInput, navigationOptions).then(
            () => {
                console.log("Navigatied");
            },
            (error) => {
                console.log("Navigate failed {0}", error);
            }
        );
    });
})