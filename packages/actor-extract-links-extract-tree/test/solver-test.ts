import { filterOperatorToRelationOperator } from '../lib/solver';
import { RelationOperator } from '@comunica/types-link-traversal';


describe('solver function',()=>{
    describe('filterOperatorToRelationOperator', ()=>{
        it('should return the RelationOperator given a string representation',()=>{
            const testTable: [string, RelationOperator][] =[
                ['=',RelationOperator.EqualThanRelation],
                ['<', RelationOperator.LessThanRelation],
                ['<=', RelationOperator.LessThanOrEqualToRelation],
                ['>', RelationOperator.GreaterThanRelation],
                ['>=', RelationOperator.GreaterThanOrEqualToRelation]
            ];

            for(const [value, expectedAnswer] of testTable){
                expect(filterOperatorToRelationOperator(value)).toBe(expectedAnswer); 
            }
        });
        it('should return undefined given a string not representing a RelationOperator', ()=>{
            expect(filterOperatorToRelationOperator("foo")).toBeUndefined();
        });
    });
});