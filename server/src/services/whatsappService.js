/**
 * WhatsApp Service — Reusable Interakt API utility
 * Used for sending automated WhatsApp messages via Interakt.
 */

const sendInteraktMessage = async (phone, templateName, bodyValues) => {
    const secretKey = process.env.whatApp_Secret;
    if (!secretKey) {
        console.warn('⚠️ whatApp_Secret not configured — skipping WhatsApp message');
        return { success: false, error: 'whatApp_Secret not configured' };
    }

    try {
        // Clean phone number
        let cleanPhone = phone.replace(/[\s\+]/g, '');
        if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) {
            cleanPhone = cleanPhone.substring(2);
        }

        const payload = {
            countryCode: '+91',
            phoneNumber: cleanPhone,
            type: 'Template',
            template: {
                name: templateName,
                languageCode: 'en',
                bodyValues,
            },
        };

        console.log(`\n📲 WhatsApp → ${cleanPhone} | Template: ${templateName}`);
        console.log('Payload:', JSON.stringify(payload, null, 2));

        const response = await fetch('https://api.interakt.ai/v1/public/message/', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${secretKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Interakt Error [${response.status}]:`, errorText);
            return { success: false, error: errorText };
        }

        const data = await response.json();
        console.log('✅ WhatsApp sent successfully:', data);
        return { success: true, data };

    } catch (err) {
        console.error('❌ WhatsApp send failed:', err.message);
        return { success: false, error: err.message };
    }
};

module.exports = { sendInteraktMessage };
