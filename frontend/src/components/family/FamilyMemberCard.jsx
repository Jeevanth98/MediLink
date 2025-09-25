import React from 'react';
import { Link } from 'react-router-dom';

const FamilyMemberCard = ({ member }) => {
  const getRelationshipIcon = (relationship) => {
    const icons = {
      'Self': '👤',
      'Spouse': '💑',
      'Child': '👶',
      'Parent': '👨‍👩‍👧',
      'Sibling': '👫',
      'Grandparent': '👴',
      'Grandchild': '👶',
      'Uncle': '👨‍💼',
      'Aunt': '👩‍💼',
      'Cousin': '👫',
      'In-Law': '👨‍👩‍👧‍👦',
      'Other': '👤'
    };
    return icons[relationship] || '👤';
  };

  return (
    <div className="bg-white rounded-xl shadow-medical p-4 hover:shadow-lg transition-shadow duration-200">
      {/* Header with Icon and Basic Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">
            {getRelationshipIcon(member.relationship)}
          </div>
          <div>
            <h3 className="font-bold text-medical-dark text-lg">
              {member.name}
            </h3>
            <p className="text-medical-text text-sm">
              {member.relationship}
            </p>
            <p className="text-medical-text text-sm">
              {member.age} years old
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Link
          to={`/family-member/${member.id}`}
          className="flex-1 bg-medical-primary text-white text-sm font-medium py-3 px-4 rounded-lg hover:bg-medical-secondary transition-colors text-center"
        >
          📋 View Details
        </Link>
        <Link
          to={`/family-member/${member.id}/add-record`}
          className="flex-1 bg-green-500 text-white text-sm font-medium py-3 px-4 rounded-lg hover:bg-green-600 transition-colors text-center"
        >
          ➕ Add Record
        </Link>
      </div>
    </div>
  );
};

export default FamilyMemberCard;