Lets start working on the system again, we'll complete everything to be seamless for the superadmin, then we'll work on role based actions. All the required changes are listed below, you are to perform these actions in the most industry grade manner possible, also perform the necessary recommended actions with but they should not contradict with the required functionality.
1. I changes the type of Resculance System in database to superadmin, since it isn't a hopital nor any fleet owner, and our system, our project, our app should learn this, that there are three types of organisations, hospital, fleet_owner and superadmin. That means our pages, our backend, our frontend eveything must be designed according to this, not just to ignore the type of superadmin to be as faulty but to consider it as genuine type, although we should not include it in any forms etc, also this option should not be available to select on any page, like the organisation type selector, it should not feature superadmin as an option, it should keep showing hospital and fleet owners as the only option
2. Lets work on organisations page first, this page should only and only be visible to superadmin, so make it secure like that, not only from frontend but backend too, any other role should not be able to access the page or the data intended for it 
3. a superadmin should not be able to delete its own organisaiton (although only superadmins are accessing it, i mean superadmin organisations should not be deletable)
4. lets add another field to the organisations table and call it is_active, change the actions on organisations page from edit, delete to edit, deactivate, an organisation once registersted should only be deactivated not deleted
5. Lets add another tab to this page, lets call it inactive, all the deactivated accounts should only be visible in this tab and not under 'all' tab
6. Lets add another page, also add the route to sidebar, its an activity page, it will show a table, table will have these columns: activity, comments, user, timestamp. Page will only be accessible to Superadmin, the page should have date, user, activity filters also a search bar and the entries will be discussed in the points ahead
7. Whenever an organisation is created or deactivated, an entry will be created in activity page, as 
activity: created / deactivated (depending upon the action) ,
comments: account created/ deactivated for the organisation : name (name of the organisation created or deactivated)
user: the name of the superadmin account,
timestamp: timestamp of that moment
8. lets add another attribute to ambulances table -status column, that attribute is disabled, when an organisation is deactivated, all of the ambulances belonging to it will have their status changed to deactivated,
, all users belonging to that organisation will have their status changed to suspended (even the admin accounts of that deactivated organisation), all partnerships will be canceled, all patients will be offboarded, 
9. Lets come to users page, this page is accessible to three type of roles, superadmin, fleet admin, hospital admin, but there are some other complications:
(a.) only superadmin can see the superadmins tab on this page, adjust the backend and frontend accordinly so there is no chance of data leak
(b). lets remove the drivers tab from this page,
(c). no approval is required for doctors and paramedics accounts, but when an admin is created, by suppose hospital admin for other admins, or fleet admins to created another admin for thier fleet, or superadmin created 
an admin or superadmin account then the rquest will first go to pending approvals tab, now this tab is also only visible or lets say available for superadmin to reject or accpet, 
10. only hospital admin can create, edit accounts for the respective organisation, same goes for fleet owners, only superadmin can create or edit any account any time, 
11. since the users tab is only avaialbe to admins and superadmin, when an admin of any respective organisation logs in, then their organisation type and organisation should already be fixed, we shouldnt have the need to select them or load them everywhere, the backend should be build such safely then other than superadmin (role and type) in under any condition, the data fetched should only belong to that particular organisation so as to prevent any potential data breaches
12. the option to select organisation type and organisation from the users page should disappear for hospitals and fleet owner admins as we have already fixed them, 
13. all actions for a suspended account should be disabled , only deactivate button who will now show activate in blue color instead of red will be there, after clicking it, that user's account  status will become active again. a suspended user should not be able to login
14. lets talk about ambulances page, this page is accessible to all the roles, but there are certain changes tha we must do: 
(a). doctors, paramedics can only see ambulances they have been assigned to and no other ambulances, they can also see, interact with partnered ambulances if they have been assigned to them
(b) the organisation type and organisation selector from the page should not be visisble or available for anybody other than superadmin, make the backend and frontend secure like that because for anybody other than superadmin, the organisation type and organisaiton are already selected and should be provided in every request made by that user automatically 
(c) change the delete action to disable on ambulances table, clicking it should change the status of the ambulance to disabled and then the action mist change to activate which will make the status change to available, a doctor, paramedic cannot activate or deactivate an ambulance, only hospital admin and fleet owner admin can that too within their respective organisation, a hospital admin will not have these options for partnered ambulances
(d) add another action view, that will directly take us to the ambulance dashboard/onboarding page which looks like this :
http://localhost:5173/onboarding/3 
but this can only be done by doctor and paramedic on the ambulances they have been assigned to 
15. lets talk about the patients page now,
(a) first of all same thing, orgnisation selector and organisation type options are only available for superadmin, other users already have their selected so they should not even see these options, they should just see patients belonging to that organisation
(b)lets add another column is_active to the patients table, delete button should not delete a patient data now, only turn the patient is_active 0, this will make it not possible to onboard them to an ambulance, any user can however use these options its not restricted in its use 
(c) In the details form, remove the option to change organisation type and organisation for anyone other than superadmin, same for add patient, edit  forms, if anyone other than superadmin will be creating a patient, then their organisation type and organisation is already there right so this option should even be there for them, not even as a read only, it should be completely non-existent for all 3 forms for any user other than superadmin, make backend and frontend secure like that to prevent any sort of data leak
(d) add onboard button in actions, then we can slect from a list of avilable status ambulances to onboard that patient, and load its data onto it 
16. On the settings page, make the change password request working and also the organisation tab on settings page, doesnt work or load data properly, that shouldnt happen so correct it 
17. Lets work on partnerships,
(a) every request, acceptance, cancellation, rejection of a partnership should be recorded as an activity and be shown on the activity page with appropriate enteries, you design them youself i trust your recommended, 
(b) this partnerships page should only be visible to superadmin, hospital admins, fleet owner admins and noone else
(c) when new partnership is clicked if hospital owner clicks it then hospitall is already selected and should be locked with no way of changing it, also handle it server side so no body could hack or disturb the system, and if the fleet owner requests it then the fleet owner option should be locked 
(d) handle the duration field better, the current method of entering and updating this field is not right or desired 
18. Lets work on onboarding page now, 
(a)again the organisation type and organisation selector should only be visible for the superadmin, for others its already selected based on their accounts, this page should be visible for all kinds of users, 
(b) add a search field beside the tabs on the tabs panel
