import { describe,it,expect } from 'vitest';
import {parseCart} from './live-cart';
describe('live cart persistence parser',()=>{
 it('rejects invalid data',()=>{expect(parseCart(null)).toBeNull();expect(parseCart({restaurantId:'no',restaurantName:'x',lines:[]})).toBeNull()});
 it('restores a valid cart',()=>{expect(parseCart({restaurantId:'rest_owner1',restaurantName:'Kitchen',lines:[{itemId:'abc',quantity:2}]})).toEqual({restaurantId:'rest_owner1',restaurantName:'Kitchen',lines:[{itemId:'abc',quantity:2}]})});
 it('rejects duplicate menu lines',()=>{expect(parseCart({restaurantId:'rest_owner1',restaurantName:'Kitchen',lines:[{itemId:'a',quantity:1},{itemId:'a',quantity:1}]})).toBeNull()});
 it('rejects excessive quantities',()=>{expect(parseCart({restaurantId:'rest_owner1',restaurantName:'Kitchen',lines:[{itemId:'a',quantity:11}]})).toBeNull()});
});
