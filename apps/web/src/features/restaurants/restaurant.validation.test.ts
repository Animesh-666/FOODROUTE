import { describe, expect, it } from 'vitest';
import { validateApplication, validateMenuDraft } from './restaurant.validation';
const menu={name:'The Golden Crunch',description:'Crispy chicken and cheddar',category:'Burgers' as const,pricePaise:24900,imageUrl:'/assets/burger.jpg',vegetarian:false,available:true,published:true};
describe('restaurant validation',()=>{
  it('accepts a valid draft',()=>expect(validateMenuDraft(menu).pricePaise).toBe(24900));
  it('rejects invalid prices',()=>expect(()=>validateMenuDraft({...menu,pricePaise:0})).toThrow());
  it('rejects insecure image protocols',()=>expect(()=>validateMenuDraft({...menu,imageUrl:'javascript:alert(1)'})).toThrow());
  it('accepts a valid application',()=>expect(validateApplication({name:'Food Route Kitchen',city:'Kolkata',cuisine:'Indian',description:'Fresh meals every day.'}).name).toBe('Food Route Kitchen'));
  it('rejects very short descriptions',()=>expect(()=>validateApplication({name:'Foo',city:'Kolkata',cuisine:'Indian',description:'Hi'})).toThrow());
});
