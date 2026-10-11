import test from 'node:test';
import assert from 'node:assert/strict';

// Deterministic model tests for the transaction invariants; the live database
// remains untouched. These do not substitute for a two-connection PostgreSQL test.
class SerializedInventory {
 constructor(stock){this.stock=stock;this.reserved=0;this.queue=Promise.resolve();}
 reserve(quantity){
  const task=this.queue.then(()=>{
   if(this.stock-this.reserved<quantity)return false;
   this.reserved+=quantity;
   return true;
  });
  this.queue=task.then(()=>undefined,()=>undefined);
  return task;
 }
}
class GrantCounter {
 constructor(limit){this.limit=limit;this.used=0;this.tokens=new Set();this.queue=Promise.resolve();}
 issue(token){this.tokens.add(token);}
 consume(token){
  const task=this.queue.then(()=>{
   if(!this.tokens.has(token)||this.used>=this.limit)return false;
   this.tokens.delete(token);this.used+=1;return true;
  });
  this.queue=task.then(()=>undefined,()=>undefined);
  return task;
 }
}
test('two simultaneous requests for final stock yield only one reservation',async()=>{
 const inventory=new SerializedInventory(1);
 const outcomes=await Promise.all([inventory.reserve(1),inventory.reserve(1)]);
 assert.deepEqual(outcomes.sort(),[false,true]);
 assert.equal(inventory.reserved,1);
});
test('replaying the same single-use digital token never consumes twice',async()=>{
 const grants=new GrantCounter(2);grants.issue('one');
 const outcomes=await Promise.all([grants.consume('one'),grants.consume('one')]);
 assert.deepEqual(outcomes.sort(),[false,true]);
 assert.equal(grants.used,1);
});
test('distinct simultaneous tokens obey global download limit',async()=>{
 const grants=new GrantCounter(1);grants.issue('one');grants.issue('two');
 const outcomes=await Promise.all([grants.consume('one'),grants.consume('two')]);
 assert.deepEqual(outcomes.sort(),[false,true]);
 assert.equal(grants.used,1);
});
