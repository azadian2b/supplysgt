/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	AUTH_SUPPLYSGTAPP2F24982C_USERPOOLID
	API_SUPPLYSGTAPP_GRAPHQLAPIIDOUTPUT
	API_SUPPLYSGTAPP_GRAPHQLAPIENDPOINTOUTPUT
	API_SUPPLYSGTAPP_UICTABLE_NAME
	API_SUPPLYSGTAPP_UICTABLE_ARN
	API_SUPPLYSGTAPP_USERTABLE_NAME
	API_SUPPLYSGTAPP_USERTABLE_ARN
	API_SUPPLYSGTAPP_UICMEMBERSHIPREQUESTTABLE_NAME
	API_SUPPLYSGTAPP_UICMEMBERSHIPREQUESTTABLE_ARN
	USER_POOL_ID
Amplify Params - DO NOT EDIT */

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: process.env.REGION });

exports.handler = async (event) => {
  try {
    // Only process events for UICMembershipRequest
    const recordType = event.detail.modelName;
    if (recordType !== 'UICMembershipRequest') return { statusCode: 200 };
    
    // Only process creation events
    if (event.detail.operation !== 'CREATE') return { statusCode: 200 };
    
    const dynamoDB = new AWS.DynamoDB.DocumentClient();
    const appsyncClient = new AWS.AppSync();
    
    // Get membership request details
    const membershipRequest = event.detail.item;
    const { userID, uicID, requestedRole } = membershipRequest;
    
    // Get UIC details
    const uicParams = {
      TableName: process.env.UIC_TABLE,
      Key: { id: uicID }
    };
    
    const uicData = await dynamoDB.get(uicParams).promise();
    if (!uicData.Item) throw new Error('UIC not found');
    
    // Get user details
    const userParams = {
      TableName: process.env.USER_TABLE,
      IndexName: 'byOwner',
      KeyConditionExpression: 'owner = :ownerValue',
      ExpressionAttributeValues: {
        ':ownerValue': userID
      }
    };
    
    const userData = await dynamoDB.query(userParams).promise();
    if (!userData.Items || userData.Items.length === 0) throw new Error('User not found');
    
    const user = userData.Items[0];
    
    // Get approvers for this UIC
    // Query users with COMMANDER, SUPPLY_SERGEANT, or FIRST_SERGEANT roles in this UIC
    const approverParams = {
      TableName: process.env.USER_TABLE,
      IndexName: 'byUIC',
      KeyConditionExpression: 'uicID = :uicValue',
      FilterExpression: 'role IN (:role1, :role2, :role3)',
      ExpressionAttributeValues: {
        ':uicValue': uicID,
        ':role1': 'COMMANDER',
        ':role2': 'SUPPLY_SERGEANT',
        ':role3': 'FIRST_SERGEANT'
      }
    };
    
    const approvers = await dynamoDB.query(approverParams).promise();
    
    if (!approvers.Items || approvers.Items.length === 0) {
      console.log('No approvers found for UIC');
      return { statusCode: 200 };
    }
    
    // Get approver email addresses
    const approverEmails = [];
    for (const approver of approvers.Items) {
      // Get user email from Cognito
      const cognito = new AWS.CognitoIdentityServiceProvider();
      const cognitoParams = {
        UserPoolId: process.env.USER_POOL_ID,
        Username: approver.owner
      };
      
      try {
        const cognitoUser = await cognito.adminGetUser(cognitoParams).promise();
        const emailAttr = cognitoUser.UserAttributes.find(attr => attr.Name === 'email');
        if (emailAttr && emailAttr.Value) {
          approverEmails.push(emailAttr.Value);
        }
      } catch (error) {
        console.error('Error getting user email:', error);
      }
    }
    
    if (approverEmails.length === 0) {
      console.log('No approver emails found');
      return { statusCode: 200 };
    }
    
    // Send email to approvers
    const baseUrl = process.env.APP_URL || 'https://yourapp.com';
    const approveUrl = `${baseUrl}/approve-request?id=${membershipRequest.id}&action=approve`;
    const rejectUrl = `${baseUrl}/approve-request?id=${membershipRequest.id}&action=reject`;
    
    const emailParams = {
      Source: process.env.FROM_EMAIL || 'noreply@yourapp.com',
      Destination: {
        ToAddresses: approverEmails
      },
      Message: {
        Subject: {
          Data: `New UIC Membership Request for ${uicData.Item.name} (${uicID})`
        },
        Body: {
          Html: {
            Data: `
              <h2>New Membership Request</h2>
              <p><strong>${user.rank} ${user.name}</strong> has requested to join your unit as a <strong>${requestedRole}</strong>.</p>
              <p><strong>Unit:</strong> ${uicData.Item.name} (${uicID})</p>
              <div style="margin: 30px 0;">
                <a href="${approveUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; margin-right: 10px; border-radius: 4px;">Approve Request</a>
                <a href="${rejectUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Decline Request</a>
              </div>
              <p>Or you can review all pending requests in your <a href="${baseUrl}/admin/requests">admin dashboard</a>.</p>
            `
          }
        }
      }
    };
    
    await ses.sendEmail(emailParams).promise();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Notification sent successfully' })
    };
  } catch (error) {
    console.error('Error processing notification:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error processing notification' })
    };
  }
}; 