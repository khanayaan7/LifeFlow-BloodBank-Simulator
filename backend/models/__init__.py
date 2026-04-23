import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    hospital_staff = "hospital_staff"
    lab_technician = "lab_technician"
    auditor = "auditor"
    donor = "donor"


class BloodGroup(str, enum.Enum):
    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"
    O_POS = "O+"
    O_NEG = "O-"


class BloodComponent(str, enum.Enum):
    whole_blood = "whole_blood"
    packed_rbc = "packed_rbc"
    plasma = "plasma"
    platelets = "platelets"


class BloodUnitStatus(str, enum.Enum):
    available = "available"
    reserved = "reserved"
    allocated = "allocated"
    expired = "expired"
    quarantined = "quarantined"


class RequestUrgency(str, enum.Enum):
    routine = "routine"
    urgent = "urgent"
    emergency = "emergency"


class RequestStatus(str, enum.Enum):
    pending = "pending"
    fulfilled = "fulfilled"
    partial = "partial"
    cancelled = "cancelled"


class ViolationSeverity(str, enum.Enum):
    minor = "minor"
    moderate = "moderate"
    critical = "critical"
