import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import OutCall "http-outcalls/outcall";

actor {
  public type Sport = {
    #soccer;
    #basketball;
    #tennis;
    #running;
    #swimming;
    #cycling;
    #yoga;
  };

  public type SkillLevel = {
    #beginner;
    #intermediate;
    #advanced;
    #expert;
  };

  public type UserProfile = {
    name : Text;
    primarySport : Sport;
    skillLevel : SkillLevel;
    locationPermission : Bool;
    profileComplete : Bool;
  };

  public type HelicopterBooking = {
    name : Text;
    phone : Text;
    email : Text;
    passengerCount : Nat;
    weights : Text;
    notes : Text;
    paymentMode : Text;
    startTime : Text;
    endTime : Text;
  };

  let userData = Map.empty<Principal, UserProfile>();

  public shared ({ caller }) func completeProfile(
    name : Text,
    sport : Sport,
    level : SkillLevel,
    locationPermission : Bool,
  ) : async UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous users cannot complete profiles");
    };

    let profile : UserProfile = {
      name;
      primarySport = sport;
      skillLevel = level;
      locationPermission;
      profileComplete = true;
    };

    userData.add(caller, profile);
    profile;
  };

  public shared ({ caller }) func isProfileComplete() : async Bool {
    switch (caller.isAnonymous(), userData.get(caller)) {
      case (true, _) { Runtime.trap("Anonymous users cannot have profiles") };
      case (_, null) { false };
      case (_, ?profile) { profile.profileComplete };
    };
  };

  public shared ({ caller }) func getUserProfile() : async UserProfile {
    switch (caller.isAnonymous(), userData.get(caller)) {
      case (true, _) { Runtime.trap("Anonymous users cannot have profiles") };
      case (_, null) { Runtime.trap("User not found") };
      case (_, ?profile) { profile };
    };
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func checkHelicopterAvailability(startTime : Text, endTime : Text) : async Text {
    let url = "https://www.googleapis.com/calendar/v3/freeBusy?timeMin=" # startTime # "&timeMax=" # endTime;
    await OutCall.httpGetRequest(url, [], transform);
  };

  public shared ({ caller }) func bookHelicopter(booking : HelicopterBooking) : async Text {
    let eventDescription = "Name: " # booking.name # "\n" #
      "Phone: " # booking.phone # "\n" #
      "Email: " # booking.email # "\n" #
      "Passenger Count: " # booking.passengerCount.toText() # "\n" #
      "Weights: " # booking.weights # "\n" #
      "Notes: " # booking.notes # "\n" #
      "Payment Mode: " # booking.paymentMode;

    let eventBody = "{" #
      "\"summary\": \"Sport Buddies — Helicopter Reservation\"," #
      "\"description\": " # "\"" # eventDescription # "\"" # "," #
      "\"start\": {\"dateTime\": \"" # booking.startTime # "\"}," #
      "\"end\": {\"dateTime\": \"" # booking.endTime # "\"}" #
      "}";

    let url = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
    await OutCall.httpPostRequest(url, [], eventBody, transform);
  };
};
