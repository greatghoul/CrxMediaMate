import { airtableToken } from './settings.js';

const baseUrl = 'https://api.airtable.com/v0/app8Qs43LypFyM3hu';
const contentUrl = 'https://content.airtable.com/v0/app8Qs43LypFyM3hu';
const headers = {
  'Authorization': `Bearer ${airtableToken}`,
  'Content-Type': 'application/json'
};

class Airtable {
  constructor(token) {
    this.token = token;
  }

  async listRecords() {
    const res = await fetch(`${baseUrl}/Records??maxRecords=5&view=Pending`, { headers });
    if (!res.ok) throw new Error('Failed to list records');
    const data = await res.json();
    return data.records;
  }

  async createRecord({ note }) {
    const fields = { note };
    const res = await fetch(`${baseUrl}/Records`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ fields })
    });
    if (!res.ok) throw new Error('Failed to create record');
    const data = await res.json();
    return data.id;
  }

  async finishRecords(recordIds) {
    const records = recordIds.map(id => ({ id, fields: { status: 'published' } }));
    const res = await fetch(`${baseUrl}/Records`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify({ records })
    });
    if (!res.ok) throw new Error('Failed to finish records');
    const data = await res.json();
    return data;
  }

  async uploadImage({ recordId, image }) {
    const res = await fetch(`${contentUrl}/${recordId}/image/uploadAttachment`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(image)
    });
    if (!res.ok) throw new Error('Failed to upload image');
    const data = await res.json();
    return data;
  }
}

const airtable = new Airtable(airtableToken);
export default airtable;
